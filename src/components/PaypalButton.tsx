import { useEffect } from "react"

declare global {
  interface Window {
    paypal: any
  }
}

function PaypalButton() {

  useEffect(() => {

    if (!window.paypal) return

    window.paypal.Buttons({

      createOrder: async () => {

        const res = await fetch(
          "http://localhost:5000/create-order",
          {
            method: "POST",
          }
        )

        const data = await res.json()

        return data.id
      },

      onApprove: async (data: any) => {

        const res = await fetch(
          `http://localhost:5000/capture-order/${data.orderID}`,
          {
            method: "POST",
          }
        )

        const details = await res.json()

        console.log(details)

        alert("Payment Successful ✅")
      },

      onError: (err: any) => {

        console.log(err)

        alert("Payment Failed")
      }

    }).render("#paypal-button-container")

  }, [])

  return (
    <div id="paypal-button-container"></div>
  )
}

export default PaypalButton