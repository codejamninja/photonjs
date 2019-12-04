"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const chinook_1 = require("../fixtures/chinook");
const runtime_1 = require("../runtime");
const getDMMF_1 = require("../runtime/getDMMF");
chalk_1.default.level = 0;
describe('relation where transformation', () => {
    let dmmf;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        dmmf = new runtime_1.DMMFClass(yield getDMMF_1.getDMMF({ datamodel: chinook_1.chinook }));
    }));
    test('transform correctly', () => {
        const select = {
            where: {
                Albums: {
                    some: {
                        Tracks: {
                            some: {
                                AND: {
                                    UnitPrice: 5,
                                    Playlists: {
                                        some: {
                                            Tracks: {
                                                some: {
                                                    Name: '',
                                                    Genre: {
                                                        id: 5,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };
        const document = runtime_1.makeDocument({
            dmmf,
            select,
            rootTypeName: 'query',
            rootField: 'findManyArtist',
        });
        expect(() => document.validate(select, false, 'users'))
            .toThrowErrorMatchingInlineSnapshot(`
"
Invalid \`photon.users()\` invocation:

{
  where: {
    Albums: {
      some: {
        Tracks: {
          some: {
            AND: {
              UnitPrice: 5,
              Playlists: {
                some: {
                  Tracks: {
                  ~~~~~~
                    some: {
                      Name: '',
                      Genre: {
                        id: 5
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

Unknown arg \`Tracks\` in where.Albums.some.Tracks.some.AND.0.Playlists.some.Tracks for type PlaylistTrackWhereInput. Did you mean \`Track\`? Available args:
type PlaylistTrackWhereInput {
  id?: Int | IntFilter
  AND?: PlaylistTrackWhereInput
  OR?: PlaylistTrackWhereInput
  NOT?: PlaylistTrackWhereInput
  Playlist?: PlaylistWhereInput
  Track?: TrackWhereInput
}

"
`);
    });
    test('throw correctly for incorrect deep scalar', () => {
        const select = {
            where: {
                Albums: {
                    some: {
                        Tracks: {
                            some: {
                                AND: {
                                    UnitPrice: 5,
                                    Playlists: {
                                        some: {
                                            Tracks: {
                                                some: {
                                                    Name: '',
                                                    Genre: {
                                                        id: '5',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };
        const document = runtime_1.makeDocument({
            dmmf,
            select,
            rootTypeName: 'query',
            rootField: 'findManyArtist',
        });
        expect(() => document.validate(select, false, 'users'))
            .toThrowErrorMatchingInlineSnapshot(`
"
Invalid \`photon.users()\` invocation:

{
  where: {
    Albums: {
      some: {
        Tracks: {
          some: {
            AND: {
              UnitPrice: 5,
              Playlists: {
                some: {
                  Tracks: {
                  ~~~~~~
                    some: {
                      Name: '',
                      Genre: {
                        id: '5'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

Unknown arg \`Tracks\` in where.Albums.some.Tracks.some.AND.0.Playlists.some.Tracks for type PlaylistTrackWhereInput. Did you mean \`Track\`? Available args:
type PlaylistTrackWhereInput {
  id?: Int | IntFilter
  AND?: PlaylistTrackWhereInput
  OR?: PlaylistTrackWhereInput
  NOT?: PlaylistTrackWhereInput
  Playlist?: PlaylistWhereInput
  Track?: TrackWhereInput
}

"
`);
    });
    test('throw correctly for deep at least one error', () => {
        const select = {
            where: {
                Albums: {
                    some: {
                        Tracks: {
                            some: {
                                AND: {
                                    UnitPrice: 5,
                                    Playlists: {
                                        some: {
                                            Tracks: {
                                                some: {
                                                    Name: '',
                                                    Genre: {},
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        };
        const document = runtime_1.makeDocument({
            dmmf,
            select,
            rootTypeName: 'query',
            rootField: 'findManyArtist',
        });
        expect(() => document.validate(select, false, 'artists'))
            .toThrowErrorMatchingInlineSnapshot(`
"
Invalid \`photon.artists()\` invocation:

{
  where: {
    Albums: {
      some: {
        Tracks: {
          some: {
            AND: {
              UnitPrice: 5,
              Playlists: {
                some: {
                  Tracks: {
                  ~~~~~~
                    some: {
                      Name: '',
                      Genre: {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

Unknown arg \`Tracks\` in where.Albums.some.Tracks.some.AND.0.Playlists.some.Tracks for type PlaylistTrackWhereInput. Did you mean \`Track\`? Available args:
type PlaylistTrackWhereInput {
  id?: Int | IntFilter
  AND?: PlaylistTrackWhereInput
  OR?: PlaylistTrackWhereInput
  NOT?: PlaylistTrackWhereInput
  Playlist?: PlaylistWhereInput
  Track?: TrackWhereInput
}

"
`);
    });
});
//# sourceMappingURL=relationWhereTransformation.test.js.map