import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email,
        password,
      },
    });
    // const res = await fetch("http://127.0.0.1:3000/api/v1/users/login", {
    //   method: "POST",
    //   body: {
    //     email,
    //     password,
    //   },
    // });

    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }

    // console.log(res);
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });

    // reload from server and not browser cache
    if (res.data.status === "success") location.reload(true);
  } catch (err) {
    showAlert("error", "Error logging out, try again!");
  }
};
