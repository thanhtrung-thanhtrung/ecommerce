// Session ID utility - Shared between CartContext and CheckoutContext
const getGuestSessionId = () => {
  let sessionId = localStorage.getItem("guestSessionId");
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("guestSessionId", sessionId);
    console.log("🆕 Created new guest sessionId:", sessionId);
  } else {
    console.log("🔄 Using existing guest sessionId:", sessionId);
  }
  return sessionId;
};

// Helper function to get authentication info
const getAuthInfo = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  const isAuthenticated = !!(token && user);
  return { token, isAuthenticated };
};

export { getGuestSessionId, getAuthInfo };
