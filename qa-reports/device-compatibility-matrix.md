# Device compatibility matrix — InvitesReady

**Date:** 10 October 2026

Each row names the phase that produced it. A cell that does not name a browser or device is untested.

| Surface | Chrome 154 headless | Safari 26.5.2 on this Mac | Firefox | Edge | WebKit engine | Physical iPhone, iPad, or Android |
|---|---|---|---|---|---|---|
| Home and menu | Pass at 390 and 1280 | Untested. Remote automation is off. | Not installed | Not installed | Not run | No device attached |
| Catalog at 320 | Pass. One column. Bloom is listed. | Untested | Untested | Untested | Untested | Untested |
| Wedding, login, missing page | Pass at 390 | Untested | Untested | Untested | Untested | Untested |
| Villa, Pull, Beach, Vivah, Baptism, Palace, Thiruvizha, Bloom open pages | Pass at 390 for overflow, images, and console | Untested | Untested | Untested | Untested | Untested |
| Gazal and Aurelia guest pages | Pass at 390 | Untested | Untested | Untested | Untested | Untested |
| Editor title at 375 | Pass with the long couple name | Untested | Untested | Untested | Untested | Untested |
| Website checkout | Pass on an isolated test-key site at 390: cancel, failed OTP, successful Bloom payment. Phase 5. | Untested | Untested | Untested | Untested | Untested |
| Bloom guest `/i/CfGuuJqf` | Pass at 320, 390, 768, and 1280 in Phase 6. Phase 7 rechecked 390 only: no overflow, no console errors. | Untested | Untested | Untested | Untested | Untested |
| Checkout recovery label | Chrome 154 at 1280 in Phase 7. Button changes to “Finish unlocking” when a local proof is stored. Not pressed in that pass. | Untested | Untested | Untested | Untested | Untested |
| Finish unlocking after a test payment | Chrome 154 headless on the isolated site in Phase 8. Bloom and Villa each finished on the original order. | Untested | Untested | Untested | Untested | Untested |
| Home, catalog, login, Gazal editor, Bloom `/i/CfGuuJqf` | Chrome 154 headless at 390 in Phase 8. No overflow and no console errors. Login and the Gazal name field accepted keyboard input. | Untested. Remote automation is off. | Not installed | Not installed | Not run | No device attached |
| Overlapping Finish unlocking | Phase 9. Two concurrent purchase calls for the existing Bloom test order, on the isolated test-key API. Not a new card payment. Chrome was not used for that replay. | Untested | Untested | Untested | Untested | Untested |
| Home, catalog, login, Gazal editor, Bloom `/i/CfGuuJqf` rechecked | Chrome 154 headless at 390 in Phase 9. No overflow and no console errors. | Untested. Remote automation is off. | Not installed | Not installed | Not run | No device attached |
| Server recovery in a new Chrome context | Phase 10. Isolated test-key site. Empty `sessionStorage`, same sign-in. Finish unlocking reused the original order and published. | Untested | Untested | Untested | Untested | Untested |
| On-screen keyboard, safe area, native 200% zoom | Untested | Untested | Untested | Untested | Untested | Untested |

Chrome results are emulation, not a physical device. The checkout column is the site on port 5179 talking only to the test-key API. The live site on port 5173 was not used to pay.
