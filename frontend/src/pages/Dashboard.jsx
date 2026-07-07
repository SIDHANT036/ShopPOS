import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  useEffect,
  useState,
} from "react";

import api from "../api";


export default function Dashboard() {

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    loadSales();

  }, []);



  async function loadSales() {

    try {

      const response = await api.get("/sales");

      setSales(response.data);

    } catch (error) {

      console.error(
        "Failed to load sales:",
        error
      );

    } finally {

      setLoading(false);

    }

  }



  return (

    <div>


      <h1>
        Dashboard
      </h1>


      <p>
        Welcome to Shop POS.
      </p>


      <p>
        Inventory, Billing and Sales Reports
        are available here.
      </p>



      <hr />



      <h2>
        Sales Dashboard
      </h2>



      {
        loading ? (

          <p>
            Loading sales data...
          </p>

        ) : sales.length === 0 ? (

          <p>
            No sales available yet.
          </p>

        ) : (


          <ResponsiveContainer
            width="100%"
            height={350}
          >

            <BarChart
              data={sales}
            >

              <CartesianGrid />

              <XAxis
                dataKey="invoiceNo"
              />

              <YAxis />

              <Tooltip />


              <Bar
                dataKey="total"
              />


            </BarChart>


          </ResponsiveContainer>


        )
      }


    </div>

  );

}