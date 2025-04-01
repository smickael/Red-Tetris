import { CellOptions } from "../utils/types";

interface Props {
  type: CellOptions;
}

export function Cell({ type }: Props) {
  return (
    <div className={`w-10 rounded-md aspect-square border border-lightDavysGrey  cell-${type}`} />
  );
}
