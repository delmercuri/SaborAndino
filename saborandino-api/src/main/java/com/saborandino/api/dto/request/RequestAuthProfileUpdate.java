package com.saborandino.api.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RequestAuthProfileUpdate {
    @NotBlank(message = "El correo actual es obligatorio.")
    @Email(message = "El correo actual no tiene un formato válido.")
    private String currentEmail;

    @NotBlank(message = "El nombre visible es obligatorio.")
    @Size(max = 120, message = "El nombre visible no debe superar 120 caracteres.")
    private String name;

    @NotBlank(message = "Los nombres son obligatorios.")
    @Size(max = 70, message = "Los nombres no deben superar 70 caracteres.")
    private String firstName;

    @NotBlank(message = "Los apellidos son obligatorios.")
    @Size(max = 80, message = "Los apellidos no deben superar 80 caracteres.")
    private String lastName;

    @NotBlank(message = "El correo es obligatorio.")
    @Email(message = "El correo no tiene un formato válido.")
    @Size(max = 100, message = "El correo no debe superar 100 caracteres.")
    private String email;

    @Pattern(regexp = "^$|^[0-9+()\\-\\s]{7,20}$", message = "El teléfono no tiene un formato válido.")
    private String phone;

    @NotBlank(message = "El cargo es obligatorio.")
    @Size(max = 100, message = "El cargo no debe superar 100 caracteres.")
    private String position;

    @NotBlank(message = "La sucursal asignada es obligatoria.")
    @Size(max = 120, message = "La sucursal asignada no debe superar 120 caracteres.")
    private String branch;

    private String avatarUrl;
}
