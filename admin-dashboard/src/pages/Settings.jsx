import React, { useEffect, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import axios from 'axios';

const Settings = () => {
    const [settings, setSettings] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/test/danhsach');
                setSettings(response.data.data);
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FiSettings /> Danh mục
            </h2>

            <div className="bg-white p-4 rounded shadow">
                <table className="w-full border border-gray-300 text-left">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 border">ID</th>
                            <th className="px-4 py-2 border">Tên</th>
                        </tr>
                    </thead>
                    <tbody>
                        {settings.map((dm) => (
                            <tr key={dm.id}>
                                <td className="p-2 border">{dm.id}</td>
                                <td className="p-2 border">{dm.Ten}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Settings;
