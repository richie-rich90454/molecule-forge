import type { ISimParams } from "../sim/IForceCalculator";

export interface IPresetSpawn {
    readonly moleculeId: string;
    readonly count: number;
}

export interface IPresetConditions {
    readonly temperature?: number;
    readonly pressure?: number;
    readonly ph?: number;
    readonly viscosity?: number;
    readonly polarity?: number;
    readonly gravity?: number;
    readonly catalyst?: number;
}

export interface IPreset {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly seed: number;
    readonly spawns: ReadonlyArray<IPresetSpawn>;
    readonly conditions: IPresetConditions;
}

export class PresetCatalog {
    public static buildPresets(): IPreset[] {
        return [
            {
                id: "primordial-soup",
                name: "Primordial Soup",
                description: "Amino acids simmer under lightning",
                seed: 1101,
                spawns: [
                    { moleculeId: "glycine", count: 8 },
                    { moleculeId: "alanine", count: 6 },
                    { moleculeId: "water", count: 14 },
                    { moleculeId: "ammonia", count: 4 },
                ],
                conditions: { temperature: 900, catalyst: 0.4 },
            },
            {
                id: "combustion-chamber",
                name: "Combustion Chamber",
                description: "Octane vapor meets oxygen and a spark",
                seed: 1102,
                spawns: [
                    { moleculeId: "alkane-c8", count: 6 },
                    { moleculeId: "oxygen", count: 16 },
                ],
                conditions: { temperature: 750 },
            },
            {
                id: "polymer-factory",
                name: "Polymer Factory",
                description: "Styrene with catalyst, ready to chain",
                seed: 1103,
                spawns: [{ moleculeId: "styrene", count: 18 }],
                conditions: { temperature: 340, catalyst: 0.8 },
            },
            {
                id: "protein-folding",
                name: "Protein Folding",
                description: "Insulin collapses into shape",
                seed: 1104,
                spawns: [
                    { moleculeId: "insulin", count: 3 },
                    { moleculeId: "water", count: 16 },
                ],
                conditions: { temperature: 300 },
            },
            {
                id: "crystal-cave",
                name: "Crystal Cave",
                description: "Salt blooms in freezing brine",
                seed: 1105,
                spawns: [
                    { moleculeId: "sodium-chloride", count: 12 },
                    { moleculeId: "water", count: 18 },
                ],
                conditions: { temperature: 260 },
            },
            {
                id: "explosion-lab",
                name: "Explosion Lab",
                description: "Handle with care: live energetics",
                seed: 1106,
                spawns: [
                    { moleculeId: "nitroglycerin", count: 4 },
                    { moleculeId: "tnt", count: 3 },
                    { moleculeId: "rdx", count: 3 },
                ],
                conditions: { temperature: 300 },
            },
            {
                id: "neuron-synapse",
                name: "Neuron Synapse",
                description: "Dopamine release across the gap",
                seed: 1107,
                spawns: [
                    { moleculeId: "dopamine", count: 8 },
                    { moleculeId: "serotonin", count: 6 },
                    { moleculeId: "water", count: 10 },
                ],
                conditions: { temperature: 310 },
            },
            {
                id: "dna-replication",
                name: "DNA Replication",
                description: "Base pairs zip and unzip",
                seed: 1108,
                spawns: [
                    { moleculeId: "dna-duplex", count: 2 },
                    { moleculeId: "adenine", count: 6 },
                    { moleculeId: "thymine", count: 6 },
                    { moleculeId: "water", count: 8 },
                ],
                conditions: { temperature: 330 },
            },
            {
                id: "petri-dish",
                name: "Petri Dish",
                description: "Sugar-rich broth for hungry chemistry",
                seed: 1109,
                spawns: [
                    { moleculeId: "glucose", count: 8 },
                    { moleculeId: "water", count: 16 },
                    { moleculeId: "glycine", count: 4 },
                ],
                conditions: { temperature: 310 },
            },
            {
                id: "toxicology",
                name: "Toxicology",
                description: "Cyanide meets the respiratory chain",
                seed: 1110,
                spawns: [
                    { moleculeId: "hcn", count: 4 },
                    { moleculeId: "heme-b", count: 3 },
                    { moleculeId: "oxygen", count: 8 },
                ],
                conditions: { temperature: 310 },
            },
            {
                id: "nanotube-growth",
                name: "Nanotube Growth",
                description: "Carbon self-assembles into tubes",
                seed: 1111,
                spawns: [
                    { moleculeId: "nanotube-armchair", count: 2 },
                    { moleculeId: "graphene", count: 3 },
                    { moleculeId: "c60", count: 4 },
                ],
                conditions: { temperature: 1200 },
            },
            {
                id: "chirality-mirror",
                name: "Chirality Mirror",
                description: "cis versus trans side by side",
                seed: 1112,
                spawns: [
                    { moleculeId: "cis-2-butene", count: 6 },
                    { moleculeId: "trans-2-butene", count: 6 },
                ],
                conditions: { temperature: 298 },
            },
            {
                id: "fullerene-formation",
                name: "Fullerene Formation",
                description: "Carbon vapor condenses into cages",
                seed: 1113,
                spawns: [
                    { moleculeId: "c60", count: 4 },
                    { moleculeId: "c70", count: 2 },
                    { moleculeId: "graphite", count: 2 },
                ],
                conditions: { temperature: 1400 },
            },
            {
                id: "graphene-exfoliation",
                name: "Graphene Exfoliation",
                description: "Layers peel off graphite",
                seed: 1114,
                spawns: [
                    { moleculeId: "graphite", count: 3 },
                    { moleculeId: "graphene", count: 4 },
                ],
                conditions: { temperature: 400 },
            },
            {
                id: "hemoglobin-loading",
                name: "Hemoglobin Loading",
                description: "Heme sites catch oxygen",
                seed: 1115,
                spawns: [
                    { moleculeId: "heme-b", count: 4 },
                    { moleculeId: "oxygen", count: 12 },
                ],
                conditions: { temperature: 310 },
            },
            {
                id: "atp-cycle",
                name: "ATP Cycle",
                description: "Cellular batteries discharging",
                seed: 1116,
                spawns: [
                    { moleculeId: "atp", count: 8 },
                    { moleculeId: "water", count: 12 },
                ],
                conditions: { temperature: 310, catalyst: 0.3 },
            },
            {
                id: "kevlar-spinning",
                name: "Kevlar Spinning",
                description: "Aramid chains align into fiber",
                seed: 1117,
                spawns: [{ moleculeId: "kevlar", count: 6 }],
                conditions: { temperature: 320 },
            },
            {
                id: "teflon-coating",
                name: "Teflon Coating",
                description: "Slippery fluoropolymer surface",
                seed: 1118,
                spawns: [{ moleculeId: "ptfe", count: 8 }],
                conditions: { temperature: 300 },
            },
            {
                id: "sarin-neutralization",
                name: "Sarin Neutralization",
                description: "Hydroxide attacks the nerve agent",
                seed: 1119,
                spawns: [
                    { moleculeId: "sarin", count: 3 },
                    { moleculeId: "water", count: 14 },
                    { moleculeId: "sodium-chloride", count: 2 },
                ],
                conditions: { temperature: 298, ph: 10 },
            },
            {
                id: "caffeine-extraction",
                name: "Caffeine Extraction",
                description: "Solvent pulls the stimulant out",
                seed: 1120,
                spawns: [
                    { moleculeId: "caffeine", count: 6 },
                    { moleculeId: "water", count: 12 },
                    { moleculeId: "ethanol", count: 8 },
                ],
                conditions: { temperature: 340, polarity: 0.7 },
            },
            {
                id: "cryogenic-lab",
                name: "Cryogenic Lab",
                description: "Liquid nitrogen holds everything still",
                seed: 1121,
                spawns: [
                    { moleculeId: "nitrogen", count: 14 },
                    { moleculeId: "oxygen", count: 8 },
                    { moleculeId: "argon", count: 4 },
                    { moleculeId: "water", count: 6 },
                ],
                conditions: { temperature: 77, viscosity: 0.05 },
            },
            {
                id: "acid-rain",
                name: "Acid Rain",
                description: "Sulfur and nitrogen oxides dissolve into the clouds",
                seed: 1122,
                spawns: [
                    { moleculeId: "sulfur-dioxide", count: 6 },
                    { moleculeId: "nitrogen-dioxide", count: 4 },
                    { moleculeId: "water", count: 12 },
                    { moleculeId: "sulfuric-acid", count: 3 },
                    { moleculeId: "nitric-acid", count: 3 },
                ],
                conditions: { temperature: 290, ph: 3.5 },
            },
            {
                id: "photosynthesis",
                name: "Photosynthesis",
                description: "Light drives carbon dioxide into sugar",
                seed: 1123,
                spawns: [
                    { moleculeId: "carbon-dioxide", count: 10 },
                    { moleculeId: "water", count: 12 },
                    { moleculeId: "glucose", count: 4 },
                    { moleculeId: "oxygen", count: 10 },
                ],
                conditions: { temperature: 300, catalyst: 0.2 },
            },
            {
                id: "fermentation",
                name: "Fermentation",
                description: "Yeast turns sugar into alcohol and gas",
                seed: 1124,
                spawns: [
                    { moleculeId: "glucose", count: 10 },
                    { moleculeId: "ethanol", count: 6 },
                    { moleculeId: "carbon-dioxide", count: 8 },
                ],
                conditions: { temperature: 310, ph: 5 },
            },
            {
                id: "greenhouse",
                name: "Greenhouse Blanket",
                description: "Trace gases trap the outgoing heat",
                seed: 1125,
                spawns: [
                    { moleculeId: "carbon-dioxide", count: 12 },
                    { moleculeId: "alkane-c1", count: 6 },
                    { moleculeId: "water", count: 8 },
                    { moleculeId: "nitrous-oxide", count: 4 },
                ],
                conditions: { temperature: 320, pressure: 1.2 },
            },
            {
                id: "ozone-depletion",
                name: "Ozone Depletion",
                description: "Chlorine radicals tear the stratosphere apart",
                seed: 1126,
                spawns: [
                    { moleculeId: "ozone", count: 8 },
                    { moleculeId: "chlorine", count: 4 },
                    { moleculeId: "cfc-12", count: 4 },
                    { moleculeId: "fluorine", count: 2 },
                ],
                conditions: { temperature: 210, pressure: 0.4 },
            },
            {
                id: "photochemical-smog",
                name: "Photochemical Smog",
                description: "Sunlight cooks exhaust into haze",
                seed: 1127,
                spawns: [
                    { moleculeId: "nitrogen-dioxide", count: 6 },
                    { moleculeId: "ozone", count: 6 },
                    { moleculeId: "formaldehyde", count: 4 },
                    { moleculeId: "acetaldehyde", count: 4 },
                ],
                conditions: { temperature: 330, polarity: 0.6 },
            },
            {
                id: "rocket-propellant",
                name: "Rocket Propellant",
                description: "Oxidizer and fuel wait for ignition",
                seed: 1128,
                spawns: [
                    { moleculeId: "nitrous-oxide", count: 8 },
                    { moleculeId: "hydrogen", count: 12 },
                    { moleculeId: "hydrogen-peroxide", count: 4 },
                    { moleculeId: "oxygen", count: 6 },
                ],
                conditions: { temperature: 500, pressure: 0.6 },
            },
            {
                id: "noble-glow",
                name: "Noble Gas Glow",
                description: "Sealed tubes of unreactive light",
                seed: 1129,
                spawns: [
                    { moleculeId: "helium", count: 4 },
                    { moleculeId: "neon", count: 6 },
                    { moleculeId: "argon", count: 6 },
                    { moleculeId: "krypton", count: 4 },
                    { moleculeId: "xenon", count: 3 },
                ],
                conditions: { temperature: 260, pressure: 0.3 },
            },
            {
                id: "halogen-series",
                name: "Halogen Series",
                description: "The reactive column, top to bottom",
                seed: 1130,
                spawns: [
                    { moleculeId: "fluorine", count: 4 },
                    { moleculeId: "chlorine", count: 4 },
                    { moleculeId: "bromine", count: 4 },
                    { moleculeId: "iodine", count: 4 },
                    { moleculeId: "hydrogen", count: 6 },
                ],
                conditions: { temperature: 300 },
            },
            {
                id: "semiconductor-dope",
                name: "Semiconductor Doping",
                description: "Dopants tune silicon's band gap",
                seed: 1131,
                spawns: [
                    { moleculeId: "el-si", count: 10 },
                    { moleculeId: "el-ga", count: 3 },
                    { moleculeId: "el-as", count: 3 },
                    { moleculeId: "el-ge", count: 4 },
                    { moleculeId: "el-b", count: 3 },
                ],
                conditions: { temperature: 900, pressure: 0.8 },
            },
            {
                id: "heavy-metal",
                name: "Heavy Metal Sludge",
                description: "Toxic cations sink through the water",
                seed: 1132,
                spawns: [
                    { moleculeId: "el-pb", count: 4 },
                    { moleculeId: "el-hg", count: 4 },
                    { moleculeId: "el-cd", count: 3 },
                    { moleculeId: "el-cr", count: 3 },
                    { moleculeId: "water", count: 10 },
                ],
                conditions: { temperature: 290, ph: 4, gravity: 0.6 },
            },
            {
                id: "actinide-ridge",
                name: "Actinide Ridge",
                description: "The heavy end of the periodic table",
                seed: 1133,
                spawns: [
                    { moleculeId: "el-u", count: 3 },
                    { moleculeId: "el-pu", count: 2 },
                    { moleculeId: "el-th", count: 4 },
                    { moleculeId: "el-ra", count: 3 },
                    { moleculeId: "el-pa", count: 2 },
                ],
                conditions: { temperature: 600, pressure: 1.4 },
            },
            {
                id: "nucleotide-pool",
                name: "Nucleotide Pool",
                description: "Free bases ready to pair and polymerize",
                seed: 1134,
                spawns: [
                    { moleculeId: "adenine", count: 5 },
                    { moleculeId: "guanine", count: 5 },
                    { moleculeId: "cytosine", count: 5 },
                    { moleculeId: "thymine", count: 5 },
                    { moleculeId: "uracil", count: 4 },
                    { moleculeId: "water", count: 10 },
                ],
                conditions: { temperature: 310, ph: 7.4 },
            },
            {
                id: "steroid-pathway",
                name: "Steroid Pathway",
                description: "Cholesterol branches into hormones",
                seed: 1135,
                spawns: [
                    { moleculeId: "cholesterol", count: 5 },
                    { moleculeId: "testosterone", count: 4 },
                    { moleculeId: "estradiol", count: 4 },
                    { moleculeId: "progesterone", count: 4 },
                    { moleculeId: "cortisol", count: 4 },
                ],
                conditions: { temperature: 310, catalyst: 0.5 },
            },
            {
                id: "essential-oils",
                name: "Essential Oils",
                description: "Volatile plant aromatics in the air",
                seed: 1136,
                spawns: [
                    { moleculeId: "limonene", count: 6 },
                    { moleculeId: "menthol", count: 5 },
                    { moleculeId: "camphor", count: 4 },
                    { moleculeId: "eugenol", count: 4 },
                    { moleculeId: "thymol", count: 4 },
                ],
                conditions: { temperature: 300, viscosity: 0.4, polarity: 0.3 },
            },
        ];
    }

    public static applyConditions(params: ISimParams, conditions: IPresetConditions): void {
        if (conditions.temperature !== undefined) {
            params.temperature = conditions.temperature;
        }
        if (conditions.pressure !== undefined) {
            params.pressure = conditions.pressure;
        }
        if (conditions.ph !== undefined) {
            params.ph = conditions.ph;
        }
        if (conditions.viscosity !== undefined) {
            params.viscosity = conditions.viscosity;
        }
        if (conditions.polarity !== undefined) {
            params.polarity = conditions.polarity;
        }
        if (conditions.gravity !== undefined) {
            params.gravity = conditions.gravity;
        }
        if (conditions.catalyst !== undefined) {
            params.catalyst = conditions.catalyst;
        }
    }
}
