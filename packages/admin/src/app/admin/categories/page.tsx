import { CategoryService } from "@wse/core/services/category";
import { Plus, Edit2, Trash2, CornerDownRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@wse/core/components/ui/button";
import { FallbackImage } from "@wse/core/components/common/FallbackImage";
import { mediaImageSrc } from "@wse/core/lib/images";

export default async function AdminCategories() {
  const categoryTree = await CategoryService.getTree();

  // Helper to flatten tree for table display with depth
  const flattenTree = (nodes: any[], depth = 0): any[] => {
    return nodes.reduce((acc, node) => {
      acc.push({ ...node, depth });
      if (node.children && node.children.length > 0) {
        acc.push(...flattenTree(node.children, depth + 1));
      }
      return acc;
    }, []);
  };

  const categories = flattenTree(categoryTree);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight mb-2 uppercase italic text-white leading-[0.9]">
            Kategóriák <span className="admin-headline-accent">Kezelése</span>
          </h1>
          <p className="text-white/40 font-medium italic">Itt kezelheti a bolt termék-kategóriáit és azok hierarchiáját.</p>
        </div>
        <Link href="/admin/categories/new" className="w-full sm:w-auto">
          <Button variant="krausz" className="w-full sm:w-auto h-14 px-8 flex items-center gap-3">
            <Plus className="w-5 h-5" />
            ÚJ KATEGÓRIA
          </Button>
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-none overflow-hidden text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Név</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500">Slug</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-neutral-500 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-white/20 italic">
                    Még nincsenek kategóriák létrehozva.
                  </td>
                </tr>
              ) : (
                categories.map((category: any) => (
                  <tr key={category._id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {/* Hierarchy Indentation */}
                        {category.depth > 0 && (
                          <div 
                            className="flex items-center text-white/40" 
                            style={{ marginLeft: `${(category.depth - 1) * 2}rem` }}
                          >
                            <CornerDownRight className="w-4 h-4 mr-2" />
                          </div>
                        )}
                        
                        <div className="w-12 h-12 rounded-none bg-neutral-900 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-white/25 transition-colors shrink-0">
                          <FallbackImage src={mediaImageSrc(category.image)} alt={category.name} width={48} height={48} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                          <p className="font-heading font-black text-white uppercase tracking-wider text-sm">{category.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px]">
                      <span className="text-neutral-500">/{category.slug}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <Link href={`/admin/categories/${category._id}`}>
                          <Button variant="ghost" size="icon" className="hover:bg-white/10 text-neutral-500 hover:text-white rounded-none border border-transparent hover:border-white/10 transition-all">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        {/* Note: Delete logic for categories with children should be handled carefully */}
                        <Button variant="ghost" size="icon" className="hover:bg-rose-500/10 text-neutral-500 hover:text-rose-500 rounded-none border border-transparent hover:border-rose-500/20 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
