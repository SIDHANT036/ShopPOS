import { useState } from "react";

import Inventory from "./pages/Inventory";
import Billing from "./pages/Billing";


function App(){

const [page,setPage]=useState("inventory");


return (

<div
style={{
display:"flex",
height:"100vh",
fontFamily:"Inter, Arial"
}}
>


{/* Sidebar */}

<aside

style={{

width:"240px",

background:"#111827",

color:"white",

padding:"25px"

}}

>


<h2>
🛒 Shop POS
</h2>



<button

style={{

width:"100%",

padding:"12px",

marginTop:"30px",

cursor:"pointer"

}}

onClick={()=>setPage("inventory")}

>

📦 Inventory

</button>




<button

style={{

width:"100%",

padding:"12px",

marginTop:"15px",

cursor:"pointer"

}}

onClick={()=>setPage("billing")}

>

🧾 Billing

</button>



</aside>





{/* Main Area */}

<main

style={{

flex:1,

background:"#f5f7fb",

overflow:"auto"

}}

>


{

page==="inventory"

?

<Inventory/>

:

<Billing/>

}


</main>


</div>

);


}


export default App;