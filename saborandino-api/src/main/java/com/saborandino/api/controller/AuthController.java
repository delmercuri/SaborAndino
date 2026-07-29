package com.saborandino.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.saborandino.api.business.BusinessAuth;
import com.saborandino.api.dto.request.RequestAuthChangePassword;
import com.saborandino.api.dto.request.RequestAuthLogin;
import com.saborandino.api.dto.request.RequestAuthProfileUpdate;
import com.saborandino.api.dto.request.RequestAuthRefresh;
import com.saborandino.api.dto.response.ResponseAdminProfile;
import com.saborandino.api.dto.response.ResponseAuthToken;
import com.saborandino.api.frontend.FrontendApiResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping(path = "auth")
public class AuthController {
	private final BusinessAuth businessAuth;

	public AuthController(BusinessAuth businessAuth) {
		this.businessAuth = businessAuth;
	}

	@PostMapping(path = "login")
	public ResponseEntity<ResponseAuthToken> actionLogin(
		@Valid @RequestBody RequestAuthLogin request,
		BindingResult bindingResult
	) {
		try {
			ResponseAuthToken response = validate(bindingResult);

			if(response != null) {
				return ResponseEntity.ok(response);
			}

			return ResponseEntity.ok(businessAuth.login(request));
		} catch(Exception exception) {
			ResponseAuthToken response = new ResponseAuthToken();
			response.error();
			response.listMessage.add("No se pudo iniciar sesión. Verifica el correo, la contraseña y la conexión con la base de datos.");

			return ResponseEntity.ok(response);
		}
	}

	@GetMapping(path = "profile")
	public ResponseEntity<FrontendApiResponse<ResponseAdminProfile>> actionProfile(
		@RequestParam String email
	) {
		try {
			return ResponseEntity.ok(FrontendApiResponse.ok(
				"Perfil administrativo obtenido.", businessAuth.getProfile(email)));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.ok(FrontendApiResponse.fail(ex.getMessage()));
		} catch (Exception ex) {
			return ResponseEntity.ok(FrontendApiResponse.fail("No se pudo obtener el perfil administrativo."));
		}
	}

	@PutMapping(path = "profile")
	public ResponseEntity<FrontendApiResponse<ResponseAdminProfile>> actionUpdateProfile(
		@Valid @RequestBody RequestAuthProfileUpdate request,
		BindingResult bindingResult
	) {
		if (bindingResult.hasErrors()) {
			String message = bindingResult.getAllErrors().getFirst().getDefaultMessage();
			return ResponseEntity.ok(FrontendApiResponse.fail(message));
		}
		try {
			return ResponseEntity.ok(FrontendApiResponse.ok(
				"Perfil actualizado correctamente.", businessAuth.updateProfile(request)));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.ok(FrontendApiResponse.fail(ex.getMessage()));
		} catch (Exception ex) {
			return ResponseEntity.ok(FrontendApiResponse.fail("No se pudo actualizar el perfil administrativo."));
		}
	}

	@PostMapping(path = "change-password")
	public ResponseEntity<FrontendApiResponse<Void>> actionChangePassword(
		@Valid @RequestBody RequestAuthChangePassword request,
		BindingResult bindingResult
	) {
		if (bindingResult.hasErrors()) {
			String message = bindingResult.getAllErrors().getFirst().getDefaultMessage();
			return ResponseEntity.ok(FrontendApiResponse.fail(message));
		}
		try {
			businessAuth.changePassword(request);
			return ResponseEntity.ok(FrontendApiResponse.ok("Contraseña actualizada correctamente.", null));
		} catch (IllegalArgumentException ex) {
			return ResponseEntity.ok(FrontendApiResponse.fail(ex.getMessage()));
		} catch (Exception ex) {
			return ResponseEntity.ok(FrontendApiResponse.fail("No se pudo actualizar la contraseña."));
		}
	}

	@PostMapping(path = "refresh")
	public ResponseEntity<ResponseAuthToken> actionRefresh(
		@Valid @RequestBody RequestAuthRefresh request,
		BindingResult bindingResult
	) {
		try {
			ResponseAuthToken response = validate(bindingResult);

			if(response != null) {
				return ResponseEntity.ok(response);
			}

			return ResponseEntity.ok(businessAuth.refresh(request));
		} catch(Exception exception) {
			ResponseAuthToken response = new ResponseAuthToken();
			response.error();
			response.listMessage.add("No se pudo renovar la sesión. Inicie sesión nuevamente.");

			return ResponseEntity.ok(response);
		}
	}

	private ResponseAuthToken validate(BindingResult bindingResult) {
		if(!bindingResult.hasErrors()) {
			return null;
		}

		ResponseAuthToken response = new ResponseAuthToken();
		response.error();

		bindingResult.getAllErrors().forEach(error -> {
			response.listMessage.add(error.getDefaultMessage());
		});

		return response;
	}
}