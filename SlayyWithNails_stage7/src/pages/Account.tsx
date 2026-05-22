import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { API_BASE } from "@/lib/config";

interface Order {
  id: string
  design: string
  shape?: string
  length?: string
  quantity?: number
  status: string
  createdAt: string
  type?: "shop" | "custom"
}

export default function Account() {

  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [orders,setOrders] = useState<Order[]>([])

  useEffect(()=>{
    if(!loading && !user){
      navigate("/auth")
    }
  },[user,loading,navigate])

  /* ---------------- Fetch Orders ---------------- */

  useEffect(()=>{

    const fetchOrders = async ()=>{

      try{

        const token = localStorage.getItem("token")

        if(!token) return

        /* ---- Shop Orders ---- */

        const shopRes = await fetch(`${API_BASE}/orders`,{
          headers:{
            Authorization:`Bearer ${token}`
          }
        })

        const shopData = await shopRes.json()

        const formattedShopOrders = shopData.map((o:any)=>({
        id:o._id,
        design:o.productName,
        shape:o.shape,
        length:o.length,
        quantity:o.quantity,
        status:o.status,
        type:"shop",
  createdAt:new Date(o.createdAt).toLocaleDateString()
}))

        /* ---- Custom Orders ---- */

        const customRes = await fetch(`${API_BASE}/custom-nails`,{
          headers:{
            Authorization:`Bearer ${token}`
          }
        })

        const customData = await customRes.json()

        const formattedCustomOrders = customData.map((o:any)=>({
  id:o._id,
  design:o.design,
  shape:o.shape,
  length:o.length,
  quantity:1,
  status:o.status,
  type:"custom",
  createdAt:new Date(o.createdAt).toLocaleDateString()
}))

        setOrders([
          ...formattedShopOrders,
          ...formattedCustomOrders
        ])

      }catch(err){
        console.error(err)
      }

    }

    fetchOrders()

  },[])

  if(loading)
    return(
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"/>
      </div>
    )

  return(
    <div className="min-h-screen">

      <Header/>

      <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* Greeting */}

        <div className="mb-10">
          <h1 className="font-display text-4xl font-light text-foreground">
            Hello, {user?.name} 💅
          </h1>

          <p className="text-muted-foreground font-body mt-2">
            Here are your recent nail orders
          </p>
        </div>

        {/* Order History */}

        <div>

          <h2 className="font-display text-2xl font-semibold mb-6">
            Order History
          </h2>

          {orders.length === 0 ? (

            <div className="bg-card rounded-2xl p-8 text-center border border-border">
              <p className="text-muted-foreground">
                You haven't placed any orders yet.
              </p>
            </div>

          ):(

            <div className="space-y-4">

              {orders.map((order)=>(
                <div
                  key={order.id}
                  className={`rounded-2xl p-6 shadow-card border ${
                  order.type === "custom"
                  ? "bg-purple-50 border-purple-200"
                  : "bg-card border-border"
               }`}
                >

                  <div className="flex justify-between items-center mb-3">

                    <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {order.design}
                    </h3>

                  {order.type === "custom" && (
                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
                  Custom
                  </span>
                  )}
                </div>

                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        order.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>

                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm text-muted-foreground">

                    <p>
                      <strong>Shape:</strong> {order.shape || "-"}
                    </p>

                    <p>
                      <strong>Length:</strong> {order.length || "-"}
                    </p>

                    <p>
                       <strong>Qty:</strong> {order.quantity || 1}
                    </p>

                    <p>
                      <strong>Date:</strong> {order.createdAt}
                    </p>

                    <p>
                      <strong>Order ID:</strong> {order.id}
                    </p>

                  </div>

                </div>
              ))}

            </div>

          )}

        </div>

      </div>

      <Footer/>

    </div>
  )

}