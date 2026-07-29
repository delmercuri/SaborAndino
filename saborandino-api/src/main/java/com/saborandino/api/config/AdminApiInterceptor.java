package com.saborandino.api.config;

import java.io.IOException;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import tools.jackson.databind.ObjectMapper;
import com.saborandino.api.business.BusinessAuth;
import com.saborandino.api.frontend.FrontendApiResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AdminApiInterceptor implements HandlerInterceptor {

    private final BusinessAuth businessAuth;
    private final ObjectMapper objectMapper;

    public AdminApiInterceptor(BusinessAuth businessAuth, ObjectMapper objectMapper) {
        this.businessAuth = businessAuth;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
        throws IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authorization = request.getHeader("Authorization");
        String token = authorization != null && authorization.startsWith("Bearer ")
            ? authorization.substring(7).trim()
            : "";

        if (businessAuth.isAccessTokenValid(token)) {
            return true;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(),
            FrontendApiResponse.fail("La sesión administrativa no es válida o ha expirado."));
        return false;
    }
}
