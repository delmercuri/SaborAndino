package com.saborandino.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.saborandino.api.entity.EntityUser;

@Repository
public interface RepositoryUser extends JpaRepository<EntityUser, String> {
    EntityUser findByEmailIgnoreCase(String email);
}
