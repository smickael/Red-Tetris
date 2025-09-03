import { ExtendedCellOptions } from "../utils/types";

interface Props {
  type: ExtendedCellOptions;
}

export function Cell({ type }: Props) {
  return (
    <div className={`w-10 rounded-md aspect-square border border-lightDavysGrey  cell-${type}`} />
  );
}
