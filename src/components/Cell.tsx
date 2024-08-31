import { CellOptions } from "../utils/types";

interface Props {
  type: CellOptions;
}

export function Cell({ type }: Props) {
  return (
    <div className={`w-5 aspect-square border border-gray-500  cell.${type}`} />
  );
}
