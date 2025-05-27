import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'wouter';
import backgroundImage from '@assets/Background.png';

const Cellar = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black">
        <Link href="/">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <h1 className="text-lg font-medium">Cellar</h1>
        <Search className="w-6 h-6 text-white" />
      </div>



    </div>
  );
};



export default Cellar;