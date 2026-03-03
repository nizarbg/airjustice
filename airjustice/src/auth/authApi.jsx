export async function loginRequest({ email, password }) {
  // TODO: replace with your backend:
  // const res = await fetch("http://localhost:8080/api/auth/login", { ... })
  // if (!res.ok) throw new Error("Invalid credentials");
  // return await res.json();

  // Mock:
  if (email === "demo@airjustice.tn" && password === "demo123") {
    return {
      token: "mock-jwt-token",
      user: { id: 1, name: "Demo User", email },
    };
  }
  throw new Error("Email ou mot de passe incorrect.");
}
