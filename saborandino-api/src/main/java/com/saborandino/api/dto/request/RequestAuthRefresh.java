package com.saborandino.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestAuthRefresh {
	@NotBlank(message = "El campo \"refreshToken\" es requerido.")
	private String refreshToken;
}