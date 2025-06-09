import { useEffect } from "react";
import cartAPI from "../services/cartAPI";
import { useSelector } from "react-redux";

/**
 * Hook đồng bộ sessionId cho khách vãng lai
 * Đảm bảo giỏ hàng được duy trì giữa các phiên duyệt web
 */
const useSessionSync = () => {
  const { isAuthenticated } = useSelector((state) => state.auth || {});

  useEffect(() => {
    const syncSession = async () => {
      if (!isAuthenticated) {
        // Chỉ đồng bộ session cho khách vãng lai
        await cartAPI.ensureSessionId();
      }
    };

    syncSession();
  }, [isAuthenticated]);
};

export default useSessionSync;
