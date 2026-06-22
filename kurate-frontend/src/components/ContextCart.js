import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, X, ShoppingCart,
  AlignLeft, Heading1, Table2, Image, Code2, Sigma, List,
} from "lucide-react";
import { useCartStore } from "../store/useCartStore.js";

const CHUNK_ICONS = {
  heading: Heading1, text: AlignLeft, table: Table2,
  image: Image, code: Code2, formula: Sigma, list_item: List,
};
const CHUNK_ICON_CLS = {
  heading: "text-violet-400", text: "text-zinc-400", table: "text-blue-400",
  image: "text-amber-400", code: "text-emerald-400", formula: "text-pink-400",
  list_item: "text-zinc-400",
};

function SortableItem({ item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.chunk_id });
  const removeChunk = useCartStore((s) => s.removeChunk);
  const { chunk } = item;

  const style = { transform: CSS.Transform.toString(transform), transition };

  const Icon = CHUNK_ICONS[chunk?.type] || AlignLeft;
  const iconCls = CHUNK_ICON_CLS[chunk?.type] || "text-zinc-400";

  const label = (() => {
    if (!chunk) return "Unknown chunk";
    if (chunk.type === "image") return chunk.metadata?.caption || "Image";
    return chunk.content.replace(/^#+\s+/, "").replace(/```[\s\S]*?```/g, "[code]").slice(0, 80) || chunk.type;
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 rounded-lg border bg-zinc-900 px-3 py-2.5 ${
        isDragging ? "opacity-40 border-zinc-600" : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 shrink-0 cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="mt-0.5 w-5 shrink-0 text-center text-xs font-mono text-zinc-600">
        {item.order + 1}
      </span>
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconCls}`} />
      <p className="flex-1 min-w-0 text-xs leading-relaxed text-zinc-300 line-clamp-2">{label}</p>
      <button
        onClick={() => removeChunk(item.chunk_id)}
        className="mt-0.5 shrink-0 text-zinc-600 hover:text-red-400"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ContextCart() {
  const { items, reorder, instructions, setInstructions } = useCartStore();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.chunk_id);
    reorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Context Cart</p>
          <span className="text-xs text-zinc-600">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-600">Drag to reorder. This sequence becomes your compiled prompt.</p>
      </div>

      <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
        <label className="block text-xs font-medium text-zinc-500 mb-1.5">
          Instructions <span className="font-normal text-zinc-600">(prepended to compiled prompt)</span>
        </label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="e.g. You are a technical writer. Using only the context below, answer questions about this API."
          className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-600 transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-zinc-600">
            <ShoppingCart className="h-8 w-8 opacity-30" />
            <p className="text-xs">
              Click <span className="text-zinc-400">+ Add</span> on any chunk in the Source Explorer.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.chunk_id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => <SortableItem key={item.chunk_id} item={item} />)}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}