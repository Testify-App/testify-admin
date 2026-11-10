/** Field label above pill inputs and selects. */
export const labelClass = 'mb-[11px] block text-[16px] leading-5 font-semibold'

/** 56px pill text input on the `#222834` field colour. */
export const fieldClass =
  'h-14 w-full rounded-full border border-transparent bg-tf-field px-6 text-[15px] text-white outline-none placeholder:text-tf-faint focus-visible:border-tf-lime/70 aria-invalid:border-[#f97066] read-only:text-tf-muted disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]'

/** Rounded multi-line field (review notes, descriptions). */
export const textareaClass =
  'w-full resize-none rounded-[20px] border border-transparent bg-tf-field px-6 pt-[17px] pb-4 text-[15px] leading-6 text-white outline-none placeholder:text-tf-faint focus-visible:border-tf-lime/70 aria-invalid:border-[#f97066]'

export const errorClass = 'mt-2 text-[13px] leading-5 text-[#f97066]'

/** Underlined tab with a lime indicator (Hidden Content, Role Details). */
export const tabClass =
  'relative h-[58px] text-[20px] text-[#7a7a7a] outline-none after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[3px] after:rounded-full after:bg-tf-lime after:opacity-0 focus-visible:text-white data-[state=active]:font-medium data-[state=active]:text-white data-[state=active]:after:opacity-100 [&>span]:text-[#7a7a7a] data-[state=active]:[&>span]:text-tf-lime'

/** Dark dropdown / popover surfaces. */
export const menuContentClass = 'border-tf-line bg-tf-card font-dm-sans text-white'
export const menuItemClass =
  'h-11 gap-3 px-3 text-[14px] text-white focus:bg-tf-field focus:text-white [&_svg]:size-4 [&_svg]:text-tf-muted'
