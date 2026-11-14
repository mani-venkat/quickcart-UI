
import { useSelector } from "react-redux";

function useAuth() {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector(
    (state) => state.auth.isAuthenticated
  );

  return {
    user,
    isAuthenticated,
  };
}

export default useAuth;
