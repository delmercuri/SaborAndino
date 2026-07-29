package com.saborandino.api.dto.response;

import com.saborandino.api.generic.ResponseGeneric;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseAuthToken extends ResponseGeneric {
	private String accessToken;
	private String refreshToken;
	private Integer expiresIn;
	private Integer refreshExpiresIn;
	private String tokenType;
}