import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import api from "../services/api";

function Patients() {

  const [patients,setPatients] = useState([]);
  const [search,setSearch] = useState("");
  const [currentPage,setCurrentPage] = useState(1);

  const itemsPerPage = 5;

  useEffect(()=>{
    getPatients();
  },[])

  const getPatients = async()=>{
    const res = await api.get('/patients');
    setPatients(res.data);
  }

  const filteredPatients = patients.filter((patient)=>
    patient.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredPatients.length/itemsPerPage);

  const start = (currentPage-1)*itemsPerPage;
  const end = start + itemsPerPage;

  const currentPatients = filteredPatients.slice(start,end);

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 md:ml-64 p-4 overflow-auto">

        <Header title="Patients" />

        <div className="bg-white p-5 rounded-2xl shadow-sm">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">

            <SearchInput
              search={search}
              setSearch={setSearch}
            />

            <button className="bg-blue-600 text-white px-5 py-3 rounded-lg">
              Add Patient
            </button>

          </div>

          <div className="overflow-auto">

            <table className="w-full min-w-[700px]">

              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Gender</th>
                  <th className="text-left p-3">Age</th>
                  <th className="text-left p-3">Phone</th>
                  <th className="text-left p-3">Address</th>
                </tr>
              </thead>
export default Patients