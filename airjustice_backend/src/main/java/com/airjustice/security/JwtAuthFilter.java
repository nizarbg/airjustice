package com.airjustice.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;

    public JwtAuthFilter(JwtService jwt) {
        this.jwt = jwt;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = auth.substring(7);
        try {
            Claims c = jwt.parse(token);

            // If token is a temp OTP token, it will be handled only by verify endpoint
            String email = c.getSubject();
            String role = (String) c.get("role");
            Boolean otpPending = (Boolean) c.getOrDefault("otp_pending", false);

            // Don’t authenticate normal endpoints with otp_pending token
            if (Boolean.TRUE.equals(otpPending)) {
                chain.doFilter(request, response);
                return;
            }

            var authToken = new UsernamePasswordAuthenticationToken(
                    email,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );

            SecurityContextHolder.getContext().setAuthentication(authToken);
        } catch (Exception ignored) {
            // invalid token: just continue (Spring security will block where needed)
        }

        chain.doFilter(request, response);
    }
}
