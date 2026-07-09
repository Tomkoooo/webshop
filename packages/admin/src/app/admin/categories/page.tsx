import { CategoryService } from "@wse/core/services/category";
import { Plus, Edit2, Trash2, CornerDownRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@wse/core/components/ui/button";
import { FallbackImage } from "@wse/core/components/common/FallbackImage";
import { mediaImageSrc } from "@wse/core/lib/images";
import { AdminPageScaffold } from "@wse/core/components/admin/AdminPageScaffold";
import { AdminDataTable } from "@wse/core/components/admin/AdminDataTable";

export default async function AdminCategories() {
  const categoryTree = await CategoryService.getTree();

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
    <AdminPageScaffold
      title="Kategóriák"
      description="Itt kezelheti a bolt termék-kategóriáit és azok hierarchiáját."
      actions={
        <Button asChild>
          <Link href="/admin/categories/new">
            <Plus className="size-4" />
            Új kategória
          </Link>
        </Button>
      }
    >
      <AdminDataTable
        rows={categories}
        getRowKey={(category) => category._id}
        emptyMessage="Még nincsenek kategóriák létrehozva."
        className="min-w-[600px]"
        columns={[
          {
            id: "name",
            header: "Név",
            cell: (category) => (
              <div className="flex items-center gap-4">
                {category.depth > 0 ? (
                  <div
                    className="flex items-center text-muted-foreground"
                    style={{ marginLeft: `${(category.depth - 1) * 2}rem` }}
                  >
                    <CornerDownRight className="mr-2 size-4" />
                  </div>
                ) : null}
                <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  <FallbackImage
                    src={mediaImageSrc(category.image)}
                    alt={category.name}
                    width={48}
                    height={48}
                    className="size-full object-cover"
                  />
                </div>
                <p className="text-sm font-medium">{category.name}</p>
              </div>
            ),
          },
          {
            id: "slug",
            header: "Slug",
            cell: (category) => (
              <span className="text-xs text-muted-foreground">/{category.slug}</span>
            ),
          },
          {
            id: "actions",
            header: "Műveletek",
            headerClassName: "text-right",
            className: "text-right",
            cell: (category) => (
              <div className="flex justify-end gap-2">
                <Link href={`/admin/categories/${category._id}`}>
                  <Button variant="ghost" size="icon">
                    <Edit2 className="size-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-rose-600">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />
    </AdminPageScaffold>
  );
}
