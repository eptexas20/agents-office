// Name your office and your coworkers here.
//
// Change any text inside the quotes, save this file, then refresh the office page.
// Keep the short ids on the left (mike, evan, graham, …) exactly as they are:
// saved agent assignments and the artwork use them. Each comment says who the
// character is and what they look like, so new names can fit the picture.
//
// setupDone tells AI assistants (Claude, Codex, Cursor, …) that the first-run
// naming questions have been asked. See AGENTS.md.
export const SETTINGS = {
  setupDone: false,

  office: {
    name: 'The Branch',            // shown in the header, the browser tab and on the map
    tagline: 'Your agents, at work.',
  },

  coworkers: {
    mike:   { name: 'Mitch',    role: 'Branch manager (world’s best, allegedly)' }, // the boss; suit and tie, corner office
    evan:   { name: 'Tim',      role: 'Sales, professional prankster' },            // easygoing salesman, loves a prank
    graham: { name: 'Dwayne',   role: 'Sales, assistant to the manager' },          // intense, by-the-book salesman
    june:   { name: 'Pat',      role: 'Reception, secret artist' },                 // receptionist at the front desk
    priya:  { name: 'Kaylee',   role: 'Customer service, gossip desk' },            // customer service, knows all the gossip
    ellie:  { name: 'Angie',    role: 'Accounting, party committee chair' },        // strict accountant, runs the parties
    harris: { name: 'Stan',     role: 'Sales, counting down to five' },             // grumpy veteran salesman
    nora:   { name: 'Phyllida', role: 'Sales, knitting enthusiast' },               // kind saleswoman who knits
    kelvin: { name: 'Kelvin',   role: 'Accounting, snack strategist' },             // big, gentle accountant; loves the vending machine
  },
};
