import {useEffect,useState} from "react";
import api from "../api";

import {
Edit,
Trash2,
Plus,
Search
} from "lucide-react";


export default function Inventory(){


const empty={

name:"",
category:"",
cost:"",
price:"",
quantity:"",
gst:18

};



const [items,setItems]=useState([]);

const [form,setForm]=useState(empty);

const [editId,setEditId]=useState(null);

const [search,setSearch]=useState("");

const [show,setShow]=useState(false);



function load(){

api.get(
"/items?search="+search
)
.then(res=>{

setItems(res.data);

})
.catch(()=>{

alert("Unable to load inventory");

});

}



useEffect(()=>{

load();

},[search]);





function handleChange(e){

setForm({

...form,

[e.target.name]:e.target.value

});

}





function saveItem(){


if(editId){


api.put(
"/items/"+editId,
form
)
.then(()=>{

reset();

});


}

else{


api.post(
"/items",
form
)
.then(()=>{

reset();

});


}


}



function reset(){

setForm(empty);

setEditId(null);

setShow(false);

load();

}





function edit(item){

setForm({

name:item.name,
category:item.category,
cost:item.cost,
price:item.price,
quantity:item.quantity,
gst:item.gst

});


setEditId(item.id);

setShow(true);

}





function remove(id){


if(
confirm("Delete this item?")
){

api.delete(
"/items/"+id
)
.then(load);

}


}





return (

<div className="inventory">


<div className="topbar">


<h1>
📦 Inventory Management
</h1>


<button
className="add"
onClick={()=>setShow(true)}
>

<Plus size={18}/>

Add Item

</button>


</div>




<div className="search">


<Search size={20}/>


<input

placeholder="Search item..."

value={search}

onChange={
e=>setSearch(e.target.value)
}

/>


</div>





{
show &&

<div className="modal">


<h2>

{
editId?
"Edit Item":
"Add Item"

}

</h2>



{
Object.keys(form)
.map(key=>(

<input

key={key}

name={key}

placeholder={key.toUpperCase()}

value={form[key]}

onChange={handleChange}

/>

))

}



<button
onClick={saveItem}
>

Save

</button>


<button
onClick={reset}
>

Cancel

</button>



</div>

}





<table>


<thead>

<tr>

<th>Name</th>
<th>Category</th>
<th>Cost</th>
<th>Selling</th>
<th>Stock</th>
<th>GST</th>
<th>Action</th>

</tr>

</thead>



<tbody>


{

items.map(item=>(


<tr key={item.id}>


<td>{item.name}</td>

<td>{item.category}</td>

<td>₹{item.cost}</td>

<td>₹{item.price}</td>


<td>

<span className={
item.quantity<10?
"low":
""
}>

{item.quantity}

</span>


</td>


<td>{item.gst}%</td>



<td>


<button
onClick={()=>edit(item)}
>

<Edit size={18}/>

</button>



<button

onClick={()=>remove(item.id)}

>

<Trash2 size={18}/>

</button>


</td>


</tr>


))

}


</tbody>


</table>



</div>


);

}