const RETELL_API_URL = "https://api.retellai.com/v2/create-phone-call";

const makeRecoveryCall = async ({ phone, paymentId }) => {
  if (!process.env.RETELL_API_KEY) {
    throw new Error("RETELL_API_KEY is missing");
  }

  if (!process.env.RETELL_AGENT_ID) {
    throw new Error("RETELL_AGENT_ID is missing");
  }

  if (!process.env.RETELL_PHONE_NUMBER) {
    throw new Error("RETELL_PHONE_NUMBER is missing");
  }

  const response = await fetch(RETELL_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from_number: process.env.RETELL_PHONE_NUMBER,
      to_number: String(phone),
      override_agent_id: process.env.RETELL_AGENT_ID,
      retell_llm_dynamic_variables: {
        payment_id: String(paymentId),
        customer_phone: String(phone),
      },
      metadata: {
        payment_id: String(paymentId),
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Retell call creation failed (${response.status}): ${errorBody}`);
  }

  return response.json();
};

module.exports = { makeRecoveryCall };