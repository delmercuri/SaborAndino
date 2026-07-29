package com.saborandino.api.business;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.saborandino.api.dto.request.RequestAuthChangePassword;
import com.saborandino.api.dto.request.RequestAuthLogin;
import com.saborandino.api.dto.request.RequestAuthProfileUpdate;
import com.saborandino.api.dto.request.RequestAuthRefresh;
import com.saborandino.api.dto.response.ResponseAdminProfile;
import com.saborandino.api.dto.response.ResponseAuthToken;
import com.saborandino.api.entity.EntityUser;
import com.saborandino.api.repository.RepositoryUser;

@Service
public class BusinessAuth {
    private static final long ACCESS_SECONDS = 8L * 60L * 60L;
    private static final long REFRESH_SECONDS = 24L * 60L * 60L;

    private final RepositoryUser repositoryUser;
    private final SecureRandom secureRandom = new SecureRandom();
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Map<String, TokenSession> accessTokens = new ConcurrentHashMap<>();
    private final Map<String, TokenSession> refreshTokens = new ConcurrentHashMap<>();

    public BusinessAuth(RepositoryUser repositoryUser) {
        this.repositoryUser = repositoryUser;
    }

    @Transactional
    public ResponseAuthToken login(RequestAuthLogin request) {
        ResponseAuthToken response = new ResponseAuthToken();
        EntityUser user = repositoryUser.findByEmailIgnoreCase(request.getEmail().trim());

        if (user == null || !"ACTIVO".equalsIgnoreCase(user.getStatus()) ||
            !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            response.error();
            response.listMessage.add("El correo o la contraseña son incorrectos.");
            return response;
        }

        user.setLastLoginAt(new Date());
        repositoryUser.save(user);
        fillTokens(response, user.getEmail());
        response.success();
        response.listMessage.add("Autenticación realizada correctamente.");
        return response;
    }

    @Transactional(readOnly = true)
    public ResponseAdminProfile getProfile(String email) {
        EntityUser user = repositoryUser.findByEmailIgnoreCase(email == null ? "" : email.trim());
        if (user == null || !"ACTIVO".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("No se encontró el perfil administrativo.");
        }
        return toProfile(user);
    }

    @Transactional
    public ResponseAdminProfile updateProfile(RequestAuthProfileUpdate request) {
        EntityUser user = repositoryUser.findByEmailIgnoreCase(request.getCurrentEmail().trim());
        if (user == null || !"ACTIVO".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("No se encontró el perfil administrativo.");
        }

        String newEmail = request.getEmail().trim().toLowerCase();
        EntityUser duplicate = repositoryUser.findByEmailIgnoreCase(newEmail);
        if (duplicate != null && !duplicate.getIdUser().equals(user.getIdUser())) {
            throw new IllegalArgumentException("El correo ya pertenece a otro usuario.");
        }

        user.setDisplayName(request.getName().trim());
        user.setFirstName(request.getFirstName().trim());
        user.setSurName(request.getLastName().trim());
        user.setEmail(newEmail);
        user.setPhone(clean(request.getPhone()));
        user.setPosition(request.getPosition().trim());
        user.setAssignedBranch(request.getBranch().trim());
        user.setAvatarUrl(clean(request.getAvatarUrl()));
        user.setUpdatedAt(new Date());
        repositoryUser.save(user);

        if (!newEmail.equalsIgnoreCase(request.getCurrentEmail().trim())) {
            accessTokens.values().forEach(session -> {
                if (session.email().equalsIgnoreCase(request.getCurrentEmail().trim())) {
                    session.setEmail(newEmail);
                }
            });
            refreshTokens.values().forEach(session -> {
                if (session.email().equalsIgnoreCase(request.getCurrentEmail().trim())) {
                    session.setEmail(newEmail);
                }
            });
        }
        return toProfile(user);
    }

    @Transactional
    public void changePassword(RequestAuthChangePassword request) {
        EntityUser user = repositoryUser.findByEmailIgnoreCase(request.getEmail().trim());
        if (user == null || !"ACTIVO".equalsIgnoreCase(user.getStatus()) ||
            !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("La nueva contraseña debe ser diferente de la actual.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(new Date());
        repositoryUser.save(user);
        invalidateTokensFor(user.getEmail());
    }

    public ResponseAuthToken refresh(RequestAuthRefresh request) {
        ResponseAuthToken response = new ResponseAuthToken();
        TokenSession session = validSession(refreshTokens, request.getRefreshToken());
        if (session == null) {
            response.error();
            response.listMessage.add("El token de renovación no es válido o ha expirado.");
            return response;
        }
        refreshTokens.remove(request.getRefreshToken());
        fillTokens(response, session.email());
        response.success();
        response.listMessage.add("Sesión renovada correctamente.");
        return response;
    }

    public boolean isAccessTokenValid(String token) {
        return validSession(accessTokens, token) != null;
    }

    private void fillTokens(ResponseAuthToken response, String email) {
        String accessToken = randomToken();
        String refreshToken = randomToken();
        accessTokens.put(accessToken, new TokenSession(email, Instant.now().plusSeconds(ACCESS_SECONDS)));
        refreshTokens.put(refreshToken, new TokenSession(email, Instant.now().plusSeconds(REFRESH_SECONDS)));
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setExpiresIn((int) ACCESS_SECONDS);
        response.setRefreshExpiresIn((int) REFRESH_SECONDS);
        response.setTokenType("Bearer");
    }

    private TokenSession validSession(Map<String, TokenSession> sessions, String token) {
        if (token == null || token.isBlank()) return null;
        TokenSession session = sessions.get(token);
        if (session == null) return null;
        if (session.expiresAt().isBefore(Instant.now())) {
            sessions.remove(token);
            return null;
        }
        return session;
    }

    private void invalidateTokensFor(String email) {
        accessTokens.entrySet().removeIf(entry -> entry.getValue().email().equalsIgnoreCase(email));
        refreshTokens.entrySet().removeIf(entry -> entry.getValue().email().equalsIgnoreCase(email));
    }

    private ResponseAdminProfile toProfile(EntityUser user) {
        ResponseAdminProfile profile = new ResponseAdminProfile();
        profile.setName(defaultIfBlank(user.getDisplayName(),
            (defaultIfBlank(user.getFirstName(), "Administrador") + " " + defaultIfBlank(user.getSurName(), "")).trim()));
        profile.setFirstName(defaultIfBlank(user.getFirstName(), "Administrador"));
        profile.setLastName(defaultIfBlank(user.getSurName(), "General"));
        profile.setEmail(user.getEmail());
        profile.setPhone(clean(user.getPhone()));
        profile.setPosition(defaultIfBlank(user.getPosition(), "Administrador general"));
        profile.setBranch(defaultIfBlank(user.getAssignedBranch(), "Todas las sucursales"));
        profile.setAvatarUrl(defaultIfBlank(user.getAvatarUrl(), "/images/logo/logo-sabor-andino.png"));
        profile.setRole(user.getRole());
        return profile;
    }

    private String randomToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static final class TokenSession {
        private volatile String email;
        private final Instant expiresAt;

        private TokenSession(String email, Instant expiresAt) {
            this.email = email;
            this.expiresAt = expiresAt;
        }

        private String email() { return email; }
        private Instant expiresAt() { return expiresAt; }
        private void setEmail(String email) { this.email = email; }
    }
}
