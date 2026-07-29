package com.saborandino.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestAuthLogin {
	@NotBlank(message = "El campo \"email\" es requerido.")
	@Email(message = "El campo \"email\" no tiene un formato válido.")
	private String email;

	@NotBlank(message = "El campo \"password\" es requerido.")
	private String password;
}