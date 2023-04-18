import jwt_decode from "jwt-decode";
import { refreshTokenAction } from "../redux/actions/refreshTokenAction";

export const tokenMiddleware = (store) => (next) => async (action) => {
  if (action.meta && action.meta.requiresAuth) {
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      const expiresIn = jwt_decode(token).exp * 1000 - Date.now();
      if (expiresIn < 300000) {
        // if token expires in less than 5 mins (300000ms)
        const refreshToken = state.auth.refreshToken;
        try {
          await store.dispatch(refreshTokenAction(refreshToken));
          const newToken = store.getState().auth.accessToken;
          if (!newToken) {
            throw new Error("Access token not found after refresh");
          }
        } catch (error) {
          store.dispatch({ type: "LOGOUT" });
          window.location.href = "/signin";
        }
      }
    } else {
      store.dispatch({ type: "LOGOUT" });
      window.location.href = "/signin";
    }
  }
  return next(action);
};
