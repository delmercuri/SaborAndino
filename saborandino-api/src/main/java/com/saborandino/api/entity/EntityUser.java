package com.saborandino.api.entity;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "tuser")
@Getter
@Setter
public class EntityUser {

	@Id
	@Column(name = "idUser")
	private String idUser;

	@Column(name = "firstName")
	private String firstName;

	@Column(name = "surName")
	private String surName;

	@Column(name = "displayName")
	private String displayName;

	@Column(name = "phone")
	private String phone;

	@Column(name = "position")
	private String position;

	@Column(name = "assignedBranch")
	private String assignedBranch;

	@Column(name = "avatarUrl", columnDefinition = "LONGTEXT")
	private String avatarUrl;

	@Column(name = "email")
	private String email;

	@Column(name = "password")
	private String password;

	@Column(name = "role")
	private String role;

	@Column(name = "status")
	private String status;

	@Column(name = "lastLoginAt")
	private Date lastLoginAt;

	@Column(name = "createdAt")
	private Date createdAt;

	@Column(name = "updatedAt")
	private Date updatedAt;
}
