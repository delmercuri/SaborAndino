package com.saborandino.api.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseAdminProfile {
    private String name;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    private String branch;
    private String avatarUrl;
    private String role;
}
