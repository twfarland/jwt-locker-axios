import type { AxiosInstance } from "axios";
import jwtConnect, { JwtConnectConfig } from "jwt-locker";

export default function jwtConnectAxios(
  config: Omit<
    JwtConnectConfig<AxiosInstance>,
    "setAuthHeader" | "setRefreshingInterceptor" | "setUnauthorizedInterceptor"
  >
) {
  return jwtConnect<AxiosInstance>({
    ...config,

    setAuthHeader(api, token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
    },

    setRefreshingInterceptor(api, waitForRefresh) {
      const interceptorId = api.interceptors.request.use(
        async (requestConfig) => {
          const refreshedToken = await waitForRefresh();
          requestConfig.headers.Authorization = `Bearer ${refreshedToken}`;
          return requestConfig;
        }
      );
      return () => {
        api.interceptors.request.eject(interceptorId);
      };
    },

    setUnauthorizedInterceptor(api, handleUnauthorized) {
      const interceptorId = api.interceptors.response.use(
        undefined,
        async (error: { response: { status: number } }) => {
          if (error.response.status === 401) {
            await handleUnauthorized();
          }
          return Promise.reject(error);
        }
      );
      return () => {
        api.interceptors.response.eject(interceptorId);
      };
    },
  });
}
