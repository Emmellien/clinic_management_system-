import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import api from "../services/api";

function Medicines() {

  const [medicines,setMedicines] = useState([]);
  const [search,setSearch] = useState("");
  const [currentPage,setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  useEffect(()=>{
    getMedicines();
  },[])

  const getMedicines = async()=>{
    const res = await api.get('/medicines');
    setMedicines(res.data);
  }

  const filteredMedicines = medicines.filter((medicine)=>
    medicine.medicine_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredMedicines.length/itemsPerPage);

  const start = (currentPage-1)*itemsPerPage;
  const end = start + itemsPerPage;

  const currentMedicines = filteredMedicines.slice(start,end);

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 md:ml-64 p-4 overflow-auto">

        <Header title="Medicines" />

        <div className="bg-white p-5 rounded-2xl shadow-sm">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">

            <SearchInput
              search={search}
              setSearch={setSearch}
            />

            <button className="bg-blue-600 text-white px-5 py-3 rounded-lg">
              Add Medicine
            </button>

          </div>

          <div className="overflow-auto">

            <table className="w-full min-w-[700px]">

              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Medicine</th>
                  <th className="text-left p-3">Quantity</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Expiry</th>
                </tr>
              </thead>

export default Medicines