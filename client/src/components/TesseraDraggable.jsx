import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import TesseraCard from "./TesseraCard.jsx";

// Rende una TesseraCard trascinabile. `touch-action: none` sull'elemento
// evita che il gesto di trascinamento faccia scrollare la pagina su
// telefono/tablet: senza questa riga iOS/Android intercettano il touch per
// lo scroll prima ancora che dnd-kit possa iniziare il drag.
export default function TesseraDraggable({ tessera, numero }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tessera.id,
    data: { tessera },
  });

  const style = {
    touchAction: "none",
    WebkitTouchCallout: "none",
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <TesseraCard tessera={tessera} numero={numero} />
    </div>
  );
}
