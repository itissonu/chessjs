'use client'
import Image from 'next/image';
import { useGameContext } from '@/hooks/moveContex';
import wp from '../public/wp.png';
import wr from '../public/wr.png';
import wn from '../public/wn.png';
import wb from '../public/wb.png';
import wq from '../public/wq.png';
import wk from '../public/wk.png';
import bp from '../public/bp.png';
import br from '../public/br.png';
import bn from '../public/bn.png';
import bb from '../public/bb.png';
import bq from '../public/bq.png';
import bk from '../public/bk.png';

const pieceImages:{ [key: string]: any } = {
  'wp': wp,
  'wr': wr,
  'wn': wn,
  'wb': wb,
  'wq': wq,
  'wk': wk,
  'bp': bp,
  'br': br,
  'bn': bn,
  'bb': bb,
  'bq': bq,
  'bk': bk,
};

const MovesTable = () => {
  const { moves } = useGameContext();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piece</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {moves.length!==0 && moves?.map((move, index) => {
            const pieceKey = `${move.color}${move.piece}`;
            const pieceImage = pieceImages[pieceKey];

            return (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{move.from}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{move.to}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pieceImage && (
                    <Image
                      src={pieceImage}
                      alt={`${move.color}${move.piece}`}
                      width={20}
                      height={20}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MovesTable;
