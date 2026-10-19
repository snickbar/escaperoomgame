// Story chapters and recipes are data, so writing and artwork can evolve independently.
const STORY_BOOK = [
  {
    id: 'lighthouse', title: 'The Last Light', accent: '#79d4e7',
    intro: 'The lighthouse has gone dark, and your sister Mara is aboard a rescue boat heading toward the reef. Keeper Ellis has vanished. His last note says: “The light was stopped from inside.” Restore the beacon before the boat reaches the rocks.',
    ending: 'The beacon sweeps across the reef just as Mara’s boat turns toward safe water. At dawn, Ellis returns with the coastguard: he had gone to rescue the saboteur, stranded in his own escape boat. In the keeper’s ledger, you add one final entry: everyone brought home.',
    recipes: [
      ['Empty Lantern','Oil Flask','Filled Lantern','lantern','oil','lantern-lit','The lantern catches. Fresh bootprints cross the keeper’s kitchen toward the service stairs. Whoever put out the beacon was here tonight.','The kitchen is dark. A lantern hangs beside the stairs, but its reservoir is empty.'],
      ['Locked Toolbox','Toolbox Key','Open Toolbox','box','key','box-open','Inside the toolbox is Ellis’s repair kit and a warning: the main lamp was disconnected deliberately. You can repair it, but first you need access to the upper tower.','A small key glints beneath a loose floorboard. Its teeth match a workshop lock.'],
      ['Frayed Rope','Repair Tape','Repaired Rope','rope','tape','rope-fixed','The repaired rope holds the service lift steady. From the landing you see the rescue boat’s running lights beyond the reef. There is still time.','The lift’s safety rope has frayed against a broken bracket. Do not trust it yet.'],
      ['Rusty Hatch','Oil Can','Open Hatch','hatch','oil','hatch-open','The hatch swings open. A trail of seawater leads to the generator room, where a cut cable lies beside an empty fuse holder.','Salt has seized the generator hatch. Scratches around the hinge suggest someone forced it shut.'],
      ['Broken Cable','Wire Spool','Repaired Cable','cable','wire','cable-fixed','The cable is whole again. An emergency telephone crackles: Mara reports fog around the reef. You promise her that the light will return.','A cable has been severed cleanly. The cut ends are too short to join without spare wire.'],
      ['Empty Fuse Box','Spare Fuse','Working Fuse Box','fusebox','fuse','fusebox-lit','Power returns to the tower. The keeper’s radio wakes with a recorded message: Ellis left to help someone on the north shore. He did not abandon his post.','The power switch clicks uselessly. One fuse is missing from the panel.'],
      ['Dusty Lens','Cleaning Cloth','Clear Lens','lens','cloth','lens-clear','Beneath the soot, the great lens is undamaged. Through its glass you spot a small boat stranded on the north shore—the reason Ellis went missing.','Smoke has coated the beacon lens. Even a working lamp would barely shine through it.'],
      ['Loose Gear','Crank Handle','Turning Mechanism','gear','crank','gear-turning','The beam’s turning mechanism engages. A folded chart falls from the housing, marked with the rescue boat’s safe approach.','The lamp can shine, but its turning gear has been disconnected. The socket needs a handle.'],
      ['Torn Sea Chart','Chart Fragment','Safe Passage Chart','map','fragment','map-fixed','The chart reveals the narrow channel beside the reef. You send Mara the bearing over the emergency line, then climb to the lamp room for the final repair.','Half a sea chart is pinned beside the telephone. Its missing edge contains the channel bearing.'],
      ['Empty Beacon','Beacon Bulb','Restored Beacon','beacon','bulb','beacon-lit','The replacement lamp locks into place. The room fills with white light, and the turning lens throws a bright path across the fog. Listen for Mara’s reply.','The main beacon’s bulb is gone. In the spare-parts locker, a padded case waits to be opened.'],
    ],
  },
  {
    id: 'library', title: 'The Midnight Archive', accent: '#d8b787',
    intro: 'At closing time, archivist Ada slips you a note: “Someone is replacing the town’s oldest records. Find the original charter before midnight.” Then the archive doors lock. Follow her trail, preserve the evidence, and find a way out.',
    ending: 'The original charter and the altered copy lie side by side beneath the reading lamp. Ada opens the service door with the night watchman. The forged sale of the town garden cannot stand. By morning, the archive will tell the truth again.',
    recipes: [
      ['Unlit Desk Lamp','Lamp Battery','Working Desk Lamp','lamp','battery','lamp-lit','Light spills over Ada’s desk. Her catalogue lists a charter that was supposedly destroyed fifty years ago—and a request to retrieve it tonight.','Ada’s desk lamp has been unplugged from its battery pack. The catalogue beneath it is unreadable in the dark.'],
      ['Locked Catalogue','Catalogue Key','Open Catalogue','book','key','book-open','The catalogue points to a restricted shelf. The borrower’s name has been erased, but a fresh ink stain marks the page.','A tiny brass key was left inside Ada’s teacup. The catalogue’s clasp has the same crest.'],
      ['Torn Shelf Map','Map Fragment','Complete Shelf Map','map','fragment','map-fixed','The completed map leads behind the public shelves. Ada has marked a cabinet with a drawing of a leaf: the town garden’s symbol.','A shelf map has been torn in two. The lower half should show the restricted stacks.'],
      ['Dusty Cabinet','Soft Brush','Clean Cabinet','cabinet','brush','cabinet-clean','Dust lifts from the cabinet’s label: GARDEN DEEDS. Someone recently disturbed its contents. An envelope has slipped behind the drawer.','The cabinet’s label is hidden under years of dust. Brushing it gently may expose its purpose.'],
      ['Sealed Envelope','Letter Opener','Open Envelope','envelope','opener','envelope-open','The envelope contains instructions for replacing the charter with a forged copy. The final exchange was scheduled for midnight—less than an hour from now.','An envelope bears the seal of the proposed buyer. Preserve the seal while opening it.'],
      ['Faded Rubbing','Graphite Stick','Readable Rubbing','paper','pencil','paper-marked','The rubbing reveals the original seal’s leaf pattern. The seal on the new charter has one leaf missing. You now know what evidence to look for.','Ada took a rubbing of the original wax seal, but the impression is too faint to compare.'],
      ['Broken Magnifier','Glass Lens','Repaired Magnifier','magnifier','lens','magnifier-fixed','Under magnification, the false seal’s edges show modern machine cuts. Ada was right: this document could not have been signed a century ago.','A magnifier lies in its case with the lens removed. Its frame should hold the spare glass securely.'],
      ['Loose Book Pages','Binding Cord','Restored Ledger','pages','cord','book-fixed','The restored ledger names the people who entrusted the garden to the town. In its last page is the location of the charter’s fireproof case.','Pages from the donations ledger have been scattered. The numbered binding holes still line up.'],
      ['Locked Document Case','Case Key','Original Charter','case','key','charter','The original charter is safe. Its seal matches Ada’s rubbing exactly. Bring it to the reading desk so both documents can be compared before the exchange.','A fireproof document case is hidden below the reading desk. Its lock is small but intact.'],
      ['Blank Evidence Sheet','Ink Stamp','Certified Evidence','paper','stamp','evidence','The watchman’s evidence stamp certifies the comparison. The charter, forged seal, and exchange instructions now form a complete record. Ada can safely open the service door.','The watchman left a certification sheet for anything you uncover. An unstamped account will not stop the sale.'],
    ],
  },
  {
    id: 'lucy', title: 'Pip Beyond the Garden', accent: '#9fd89a',
    intro: 'Lucy’s dog Pip slipped through the garden gate during the afternoon storm. His blue ribbon is caught on the latch, and the old orchard is flooding. Help Lucy follow his trail before the groundskeeper closes the far gate at sunset.',
    ending: 'Pip races across the little bridge and straight into Lucy’s arms, muddy, hungry, and very pleased with himself. The groundskeeper opens the orchard gate for the walk home. Lucy ties Pip’s blue ribbon back on his collar—and checks the garden latch twice.',
    recipes: [
      ['Torn Trail Map','Map Corner','Complete Trail Map','map','fragment','map-fixed','The completed map shows a sheltered path toward the orchard. Lucy remembers that Pip always follows the scent of apples after rain.','A muddy map is missing the corner that shows the orchard paths. Search the gatehouse first.'],
      ['Empty Flashlight','Fresh Batteries','Working Flashlight','flashlight','battery','flashlight-lit','The flashlight reveals a line of small pawprints inside the tool shed. They continue beneath a bench and out through a gap in the wall.','Storm clouds have made the shed too dark to search. A flashlight sits on the bench.'],
      ['Broken Gate Latch','Replacement Pin','Working Gate Latch','latch','pin','latch-fixed','The repaired latch holds the garden gate open safely. Lucy can follow you into the orchard without the wind shutting it behind her.','The orchard gate swings in the wind. Its missing hinge pin lies somewhere in the gravel.'],
      ['Frayed Lead','Repair Cord','Repaired Lead','lead','cord','lead-fixed','The lead is ready for the walk home. A strip of Pip’s blue ribbon hangs from a low branch beside the stream. You are on the right trail.','Lucy finds Pip’s old lead in her coat pocket, but its handle has come apart.'],
      ['Empty Food Bowl','Dog Biscuits','Filled Food Bowl','bowl','biscuits','bowl-filled','The biscuits’ familiar smell carries across the water. From the orchard’s far side comes a small bark, followed by a worried whine.','Pip knows the sound of his bowl. The food tin in the gatehouse should contain something he recognizes.'],
      ['Loose Bridge Board','Wooden Peg','Repaired Footbridge','plank','peg','bridge','The loose board settles firmly into place. Across the stream, wet pawprints lead toward the abandoned potting shed.','One board on the footbridge is loose. Secure it before asking Lucy to cross.'],
      ['Locked Shed','Shed Key','Open Shed','shed','key','shed-open','The shed is empty, but Pip’s muddy prints circle a covered drain behind it. A bark answers when Lucy calls his name.','The shed door is locked. A label on the groundskeeper’s key ring mentions the orchard.'],
      ['Dirty Window','Cleaning Rag','Clear Window','window','cloth','window-clear','Through the cleaned window you can see Pip standing safely on a ledge below the drain cover. He cannot climb out by himself.','The shed window overlooks the drain, but mud has splashed across the glass.'],
      ['Heavy Drain Cover','Lifting Handle','Open Drain','drain','handle','drain-open','With the cover lifted, Pip can see Lucy. He stays on his ledge while you make a safe route up; his tail is already wagging.','The drain cover is too heavy to grip by its edges. Its lifting socket is still clear.'],
      ['Folded Rescue Ramp','Ramp Support','Safe Rescue Ramp','ramp','support','ramp-ready','The ramp rests securely against the ledge. Lucy places the biscuit bowl at the top and calls softly. Pip takes one careful step, then another.','A rescue ramp is stored beside the shed. Its support must be fitted before it can carry Pip’s weight.'],
    ],
  },
];

const STORY_RECIPES = STORY_BOOK.flatMap(story => story.recipes.map((r, chapter) => ({
  theme: story.id, chapter, title: r[2], aftermath: r[6], clue: r[7],
  a: { name: r[0], img: story.id==='lighthouse'&&chapter===0 ? 'art/scenes/lantern-empty.png' : `art/story/${story.id}-${chapter}-a.svg` },
  b: { name: r[1], img: story.id==='lighthouse'&&chapter===0 ? 'art/scenes/oil-flask.png' : `art/story/${story.id}-${chapter}-b.svg` },
  c: { name: r[2], img: story.id==='lighthouse'&&chapter===0 ? 'art/scenes/lantern-lit.png' : `art/story/${story.id}-${chapter}-c.svg` },
})));
