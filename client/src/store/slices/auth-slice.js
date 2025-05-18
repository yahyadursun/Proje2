export const createAuthSlice = (set) => ({
  userInfo: JSON.parse(localStorage.getItem("userInfo")) || undefined,
  setUserInfo: (userInfo) => {
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    } else {
      localStorage.removeItem("userInfo");
    }
    set({ userInfo });
  },
});