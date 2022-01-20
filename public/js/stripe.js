import axios from "axios";
import { showAlert } from "./alerts";
const stripe = Stripe(
  "pk_test_51KJvumFtTmMlmk0qvgvifZBMSU4aobblD1OfkDtyeSW8aIblrOWR52ZB25r115bOEmsx3RHs2LCYrkvZm0LAX0Qm00e5aDesx2"
);

export const bookTour = async (tourId) => {
  try {
    // 1. Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.error(err);
    showAlert("error", err);
  }
};
