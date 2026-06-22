"""Converts a Docling document tree into granular, UI-ready chunks
that kurate-backend persists as `chunks` rows."""

from dataclasses import dataclass, field
from typing import Any

from docling_core.types.doc import (
    DocItemLabel,
    DoclingDocument,
    PictureItem,
    TableItem,
)


@dataclass
class Chunk:
    """A single structural unit destined for the Context Cart UI."""

    order: int
    type: str  # "text" | "heading" | "table" | "image" | "code" | "formula" | "list_item"
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "order": self.order,
            "type": self.type,
            "content": self.content,
            "metadata": self.metadata,
        }


_LABEL_TO_TYPE = {
    DocItemLabel.TITLE: "heading",
    DocItemLabel.SECTION_HEADER: "heading",
    DocItemLabel.PARAGRAPH: "text",
    DocItemLabel.TEXT: "text",
    DocItemLabel.LIST_ITEM: "list_item",
    DocItemLabel.CODE: "code",
    DocItemLabel.FORMULA: "formula",
    DocItemLabel.CAPTION: "text",
    DocItemLabel.FOOTNOTE: "text",
}


def build_chunks(
    doc: DoclingDocument,
    image_urls: dict[int, str],
) -> list[dict[str, Any]]:
    """Walks the document tree in reading order and emits one Chunk per element."""
    chunks: list[dict[str, Any]] = []
    order = 0

    for item, _level in doc.iterate_items(with_groups=False, traverse_pictures=False):
        chunk = _convert_item(item, doc, order, image_urls)
        if chunk is None:
            continue
        chunks.append(chunk.to_dict())
        order += 1

    return chunks


def _convert_item(
    item: Any,
    doc: DoclingDocument,
    order: int,
    image_urls: dict[int, str],
) -> Chunk | None:
    if isinstance(item, TableItem):
        return Chunk(
            order=order,
            type="table",
            content=item.export_to_markdown(doc=doc),
            metadata={
                "self_ref": item.self_ref,
                "num_rows": item.data.num_rows if item.data else None,
                "num_cols": item.data.num_cols if item.data else None,
                "caption": item.caption_text(doc) or None,
            },
        )

    if isinstance(item, PictureItem):
        asset_url = image_urls.get(id(item))
        return Chunk(
            order=order,
            type="image",
            content=asset_url or "",
            metadata={
                "self_ref": item.self_ref,
                "caption": item.caption_text(doc) or None,
                "alt_markdown": item.export_to_markdown(doc=doc),
            },
        )

    label = getattr(item, "label", None)
    text = getattr(item, "text", None)
    if text is None:
        return None
    text = text.strip()
    if not text:
        return None

    chunk_type = _LABEL_TO_TYPE.get(label, "text")
    metadata: dict[str, Any] = {
        "self_ref": getattr(item, "self_ref", None),
        "label": label.value if label is not None else None,
    }
    if chunk_type == "heading":
        metadata["level"] = getattr(item, "level", None)

    return Chunk(
        order=order,
        type=chunk_type,
        content=_render_text_chunk(item, chunk_type, text),
        metadata=metadata,
    )


def _render_text_chunk(item: Any, chunk_type: str, text: str) -> str:
    if chunk_type == "heading":
        level = getattr(item, "level", 1) or 1
        prefix = "#" * min(max(level, 1), 6)
        return f"{prefix} {text}"
    if chunk_type == "code":
        lang = getattr(item, "code_language", "") or ""
        lang_str = lang.value if hasattr(lang, "value") else str(lang)
        return f"```{lang_str}\n{text}\n```"
    if chunk_type == "formula":
        return f"$$\n{text}\n$$"
    if chunk_type == "list_item":
        marker = getattr(item, "marker", "-") or "-"
        return f"{marker} {text}"
    return text
