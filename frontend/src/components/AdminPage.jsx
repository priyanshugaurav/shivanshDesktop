import { ShieldAlert } from 'lucide-react';

const AdminPage = () => (
  <div className="flex justify-center items-center h-[80vh] bg-red-50 m-8 rounded-xl border-2 border-dashed border-red-200">
    <div className="text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-red-700">Restricted Admin Area</h1>
        <p className="text-red-600 mt-2">Only users with 'admin' privileges can view this content.</p>
    </div>
  </div>
);

export default AdminPage;