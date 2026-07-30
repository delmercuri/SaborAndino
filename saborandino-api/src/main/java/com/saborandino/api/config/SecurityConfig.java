package com.saborandino.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SecurityConfig implements WebMvcConfigurer {

    private final AdminApiInterceptor adminApiInterceptor;

    public SecurityConfig(AdminApiInterceptor adminApiInterceptor) {
        this.adminApiInterceptor = adminApiInterceptor;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://sabor-andino-gray.vercel.app",
                "https://sabor-andino-*.vercel.app"
            )
            .allowedMethods(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            )
            .allowedHeaders("*")
            .exposedHeaders("Authorization")
            .allowCredentials(true)
            .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(adminApiInterceptor)
            .addPathPatterns(
                "/api/frontend/admin/**",
                "/auth/profile",
                "/auth/profile/**",
                "/auth/change-password"
            );
    }
}