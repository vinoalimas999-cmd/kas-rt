"use client";

import { db } from "../lib/firebase";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Html5QrcodeScanner } from "html5-qrcode";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
const bulanList = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const IURAN_PER_BULAN = 10000;
export default function Home() {
  const [bulanAktif, setBulanAktif] =
    useState("Januari");

  const [hasilScan, setHasilScan] =
    useState("");

  const [namaBaru, setNamaBaru] =
    useState("");

    const [cari, setCari] =
  useState("");
 const [warga, setWarga] = useState<any[]>([]);

 const auth = getAuth();

const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [user, setUser] = useState<any>(null);
useEffect(() => {
  const unsub = onAuthStateChanged(
    auth,
    (currentUser) => {
      setUser(currentUser);
    }
  );

  return () => unsub();
}, []);
  // TAMBAH WARGA
  const tambahWarga = async () => {
    if (!namaBaru) return;

   const nomorTerbesar = Math.max(
  ...warga
    .filter((w) => w.id)
    .map((w) =>
      Number(
        w.id.replace("W", "")
      )
    ),
  0
);

const idBaru =
  "W" +
  (nomorTerbesar + 1)
    .toString()
    .padStart(3, "0");
    const dataBaru = {
      id: idBaru,
      nama: namaBaru,
      pembayaran: {
        Januari: false,
        Februari: false,
        Maret: false,
        April: false,
        Mei: false,
        Juni: false,
        Juli: false,
        Agustus: false,
        September: false,
        Oktober: false,
        November: false,
        Desember: false,
      },
    };

    try {
  await addDoc(
    collection(db, "warga"),
    dataBaru
  );


  setNamaBaru("");

  alert("Warga berhasil disimpan");
} catch (error) {
  console.error(error);
  alert("Gagal menyimpan warga");
}
  };
const hapusWarga = async (
  id: string
) => {
  try {
    const q = query(
      collection(db, "warga"),
      where("id", "==", id)
    );

    const snapshot = await getDocs(q);

    for (const d of snapshot.docs) {
  await deleteDoc(
    doc(db, "warga", d.id)
  );
}
   
    alert("Warga berhasil dihapus");
  } catch (error) {
    console.error(error);
    alert("Gagal menghapus warga");
  }
};
 // HITUNG TUNGGAKAN
const hitungTunggakan = (
  pembayaran: any
) => {
  return Object.values(
    pembayaran
  ).filter((v) => v === false)
    .length;
};

 const downloadExcel = () => {
  const data = warga.map((item) => ({
    ID: item.id,
    Nama: item.nama,
    Tunggakan: hitungTunggakan(item.pembayaran),
    Nominal: hitungTunggakan(item.pembayaran) * IURAN_PER_BULAN,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Laporan Warga"
  );

  const excelBuffer = XLSX.write(
    workbook,
    {
      bookType: "xlsx",
      type: "array",
    }
  );

  const file = new Blob(
    [excelBuffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );

  saveAs(file, "laporan-warga.xlsx");
};
const downloadPDF = () => {
  const pdf = new jsPDF();

  // isi PDF...
  pdf.save("laporan-kas-rt.pdf");
};

const loginAdmin = async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Login berhasil");
  } catch (error) {
    alert("Email atau password salah");
  }
};

const logoutAdmin = async () => {
  await signOut(auth);
};

useEffect(() => {
  const unsubscribe =
    onSnapshot(
      collection(db, "warga"),
      (snapshot) => {
        const dataFirebase =
          snapshot.docs.map((d) =>
            d.data()
          );

        setWarga(dataFirebase);
      }
    );

  return () => unsubscribe();
}, []);

  useEffect(() => {
  const unsubscribe =
    onSnapshot(
      collection(db, "warga"),
      (snapshot) => {
        const dataFirebase =
          snapshot.docs.map((d) =>
            d.data()
          );

        setWarga(dataFirebase);
      }
    );

  return () => unsubscribe();
}, []);
// SCANNER
useEffect(() => {
  if (!user) return;

  const reader =
    document.getElementById("reader");

  if (!reader) return;

  const scanner =
    new Html5QrcodeScanner(
      "reader",
      {
        fps: 5,
        qrbox: 250,
      },
      false
    );

  scanner.render(
    (decodedText) => {
      // isi callback scan yang lama
    },
    (error) => {
      console.log(error);
    }
  );

  return () => {
    scanner.clear().catch(() => {});
  };
}, [bulanAktif, user]);

  // TOTAL BULAN INI
  const totalLunas =
  warga.filter(
    (w) =>
      w.pembayaran[
        bulanAktif as keyof typeof w.pembayaran
      ] === true
  ).length;

  const totalBelum =
    warga.length - totalLunas;

    const totalKas =
  totalLunas *
  IURAN_PER_BULAN;

  console.log("USER:", user);
  if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-80">
        <h2 className="text-2xl font-bold mb-4">
          Login Admin
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full border p-3 rounded-xl mb-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-3 rounded-xl mb-3"
        />

        <button
          onClick={loginAdmin}
          className="bg-blue-600 text-white w-full p-3 rounded-xl"
        >
          Login
        </button>
      </div>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">

         <div className="flex justify-between items-center">
  <h1 className="text-4xl font-bold text-blue-600">
    Kas RT 04 Bulan
  </h1>

  <button
    onClick={logoutAdmin}
    className="bg-red-600 text-white px-4 py-2 rounded-xl"
  >
    Logout
  </button>
</div>

          <p className="text-black   mt-2">
            Sistem scan QR iuran warga
          </p>

        </div>

        {/* DASHBOARD */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">

          <div className="bg-green-500 text-white p-5 rounded-2xl">
            <h2>Sudah Bayar</h2>

            <p className="text-3xl font-bold">
              {totalLunas}
            </p>
          </div>

          <div className="bg-red-500 text-white p-5 rounded-2xl">
            <h2>Belum Bayar</h2>

            <p className="text-3xl font-bold">
              {totalBelum}
            </p>
          </div>

          <div className="bg-blue-500 text-white p-5 rounded-2xl">
            <h2>Bulan Aktif</h2>

            <p className="text-2xl font-bold">
              {bulanAktif}
            </p>
          </div>
          <div className="bg-yellow-500 text-white p-5 rounded-2xl">
  <h2>Total Kas</h2>

  <p className="text-2xl font-bold">
    Rp{" "}
    {totalKas.toLocaleString(
      "id-ID"
    )}
  </p>
</div>

        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* KIRI */}
          <div className="space-y-6">

            {/* PILIH BULAN */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">

              <h2 className="text-2xl font-bold mb-4">
                Pilih Bulan
              </h2>

              <select
                value={bulanAktif}
                onChange={(e) =>
                  setBulanAktif(
                    e.target.value
                  )
                }
                className="w-full border p-3 rounded-xl"
              >
                {bulanList.map(
                  (bulan) => (
                    <option
                      key={bulan}
                    >
                      {bulan}
                    </option>
                  )
                )}
              </select>

            </div>

            {/* TAMBAH WARGA */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">

              <h2 className="text-2xl font-bold mb-4">
                Tambah Warga
              </h2>

              <div className="flex gap-2">

                <input
                  type="text"
                  placeholder="Nama warga"
                  value={namaBaru}
                  onChange={(e) =>
                    setNamaBaru(
                      e.target.value
                    )
                  }
                  className="flex-1 border p-3 rounded-xl"
                />

                <button
                  onClick={
                    tambahWarga
                  }
                  className="bg-blue-600 text-white px-5 rounded-xl"
                >
                  Tambah
                </button>

              </div>

            </div>

            {/* SCAN */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">

              <h2 className="text-2xl font-bold mb-4">
                Scan QR
              </h2>

              <div id="reader"></div>

              <div className="mt-4 bg-green-100 p-4 rounded-xl">

                <h2 className="font-bold">
                  Hasil Scan
                </h2>

                <p>
                  {hasilScan ||
                    "Belum ada QR"}
                </p>

              </div>

            </div>

          </div>

          {/* DATA */}
          <div className="bg-white p-6 rounded-2xl shadow-lg overflow-auto">

<div className="bg-yellow-100 p-4 rounded-xl mb-4">
  <h3 className="font-bold text-lg">
    Rekap Tunggakan
  </h3>

<p className="text-sm text-black font-medium">
  Total Warga: {warga.length}
</p>

  {warga.map((item) => (
    <div
      key={item.id}
      className="flex justify-between"
    >
     <span className="text-black font-medium">
  {item.nama}
</span>
      <span
  className={
    hitungTunggakan(
      item.pembayaran
    ) === 0
      ? "text-green-600 font-bold"
      : hitungTunggakan(
          item.pembayaran
        ) <= 3
      ? "text-yellow-600 font-bold"
      : "text-red-600 font-bold"
  }
>
  {hitungTunggakan(
    item.pembayaran
  )} bulan
</span>
    </div>
  ))}
</div>
            <h2 className="text-2xl font-bold mb-6">
  Data Warga
</h2>

<button
  onClick={downloadExcel}
  className="bg-green-600 text-white px-4 py-2 rounded-xl mb-4"
>
  📥 Download Excel
</button>

<button
  onClick={downloadPDF}
  className="bg-red-600 text-white px-4 py-2 rounded-xl mb-4 ml-2"
>
  📄 Download PDF
</button>

<input
  type="text"
  placeholder="🔍 Cari warga..."
  value={cari}
  onChange={(e) =>
    setCari(e.target.value)
  }
  className="w-full border p-3 rounded-xl mb-4"
/>


            <div className="space-y-4">

              {warga
  .filter((item) =>
    item.nama
      .toLowerCase()
      .includes(cari.toLowerCase())
  )
  .map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-2xl p-4"
                  >

                    <div className="flex justify-between items-center">

                      <div>

                        <h2 className="font-bold text-xl">
                          {
                            item.nama
                          }
                        </h2>

                        <p>
                          ID:
                          {" "}
                          {
                            item.id
                          }
                        </p>

                        <p>
  Tunggakan:
  {" "}
  {hitungTunggakan(
    item.pembayaran
  )} bulan
</p>

<p className="text-red-600 font-bold">
  Rp{" "}
  {(
    hitungTunggakan(
      item.pembayaran
    ) *
    IURAN_PER_BULAN
  ).toLocaleString("id-ID")}
</p>

                      </div>

                      <QRCode
                        value={
                          item.id
                        }
                        size={80}
                      />

<button
  onClick={() => {
    if (
      confirm(
        `Yakin ingin menghapus ${item.nama}?`
      )
    ) {
      hapusWarga(item.id);
    }
  }}
  className="bg-red-500 text-white px-3 py-1 rounded-lg mt-2"
>
  🗑 Hapus
</button>
                    </div>

                    {/* STATUS BULAN */}
                    <div className="grid grid-cols-3 gap-2 mt-4">

                      {bulanList.map(
                        (bulan) => (
                          <div
                            key={bulan}
                            className={`text-center p-2 rounded-lg text-sm ${
  item.pembayaran[
    bulan as keyof typeof item.pembayaran
  ]
    ? "bg-green-500 text-white"
    : "bg-red-500 text-white"
}`}
                          >
                            {bulan.substring(
                              0,
                              3
                            )}
                          </div>
                        )
                      )}

                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}