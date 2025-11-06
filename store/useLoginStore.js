"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useLoginStore = create(
  persist(
    (set) => ({
      isLoggedIn: false,
      username: "",

      // 🔐 Login and store username
      login: (username) =>
        set({
          isLoggedIn: true,
          username: username || "",
        }),

      // 🚪 Logout and clear session
      logout: () =>
        set({
          isLoggedIn: false,
          username: "",
        }),
    }),
    {
      name: "miray-admin-session", // 🧠 key in localStorage
      getStorage: () => localStorage, // use browser localStorage
    }
  )
);

export default useLoginStore;
