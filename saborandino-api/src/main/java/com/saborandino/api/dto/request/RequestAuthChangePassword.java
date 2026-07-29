package com.saborandino.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestAuthChangePassword {
    @NotBlank(message = "El correo es obligatorio.")
    @Email(message = "El correo no tiene un formato válido.")
    private String email;

    @NotBlank(message = "La contraseña actual es obligatoria.")
    private String currentPassword;

    @NotBlank(message = "La nueva contraseña es obligatoria.")
    @Size(min = 8, max = 72, message = "La nueva contraseña debe tener entre 8 y 72 caracteres.")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$",
        message = "La nueva contraseña debe incluir mayúscula, minúscula, número y símbolo."
    )
    private String newPassword;
}
