import type { Reference } from "./types";

/** 精油の作用に関する主要文献。根拠レベルは oils.ts の各 claim で付与する。 */
export const REFERENCES: Record<string, Reference> = {
  hwang2015: {
    id: "hwang2015",
    citation:
      "Hwang E, Shin S. The effects of aromatherapy on sleep improvement: a systematic literature review and meta-analysis. J Altern Complement Med. 2015;21(2):61-68.",
    doi: "10.1089/acm.2014.0113",
  },
  lillehei2015: {
    id: "lillehei2015",
    citation:
      "Lillehei AS, et al. Effect of inhaled lavender and sleep hygiene on self-reported sleep issues: a randomized controlled trial. J Altern Complement Med. 2015;21(7):430-438.",
    doi: "10.1089/acm.2014.0327",
  },
  koulivand2013: {
    id: "koulivand2013",
    citation:
      "Koulivand PH, Khaleghi Ghadiri M, Gorji A. Lavender and the nervous system. Evid Based Complement Alternat Med. 2013;2013:681304.",
    doi: "10.1155/2013/681304",
  },
  watanabe2015: {
    id: "watanabe2015",
    citation:
      "Watanabe E, et al. Effects of bergamot (Citrus bergamia) essential oil aromatherapy on mood states, parasympathetic nervous system activity, and salivary cortisol levels in 41 healthy females. Forsch Komplementmed. 2015;22(1):43-49.",
    doi: "10.1159/000380989",
  },
  goes2012: {
    id: "goes2012",
    citation:
      "Goes TC, et al. Effect of sweet orange aroma on experimental anxiety in humans. J Altern Complement Med. 2012;18(8):798-804.",
    doi: "10.1089/acm.2011.0551",
  },
  lehrner2005: {
    id: "lehrner2005",
    citation:
      "Lehrner J, et al. Ambient odors of orange and lavender reduce anxiety and improve mood in a dental office. Physiol Behav. 2005;86(1-2):92-95.",
    doi: "10.1016/j.physbeh.2005.06.031",
  },
  moss2012: {
    id: "moss2012",
    citation:
      "Moss M, Oliver L. Plasma 1,8-cineole correlates with cognitive performance following exposure to rosemary essential oil aroma. Ther Adv Psychopharmacol. 2012;2(3):103-113.",
    doi: "10.1177/2045125312436573",
  },
  moss2003: {
    id: "moss2003",
    citation:
      "Moss M, et al. Aromas of rosemary and lavender essential oils differentially affect cognition and mood in healthy adults. Int J Neurosci. 2003;113(1):15-38.",
    doi: "10.1080/00207450390161903",
  },
  moss2008: {
    id: "moss2008",
    citation:
      "Moss M, et al. Modulation of cognitive performance and mood by aromas of peppermint and ylang-ylang. Int J Neurosci. 2008;118(1):59-77.",
    doi: "10.1080/00207450601042094",
  },
  hongratanaworakit2004: {
    id: "hongratanaworakit2004",
    citation:
      "Hongratanaworakit T, Buchbauer G. Evaluation of the harmonizing effect of ylang-ylang oil on humans after inhalation. Planta Med. 2004;70(7):632-636.",
    doi: "10.1055/s-2004-827186",
  },
  komiya2006: {
    id: "komiya2006",
    citation:
      "Komiya M, Takeuchi T, Harada E. Lemon oil vapor causes an anti-stress effect via modulating the 5-HT and DA activities in mice. Behav Brain Res. 2006;172(2):240-249.",
    doi: "10.1016/j.bbr.2006.05.006",
  },
  komori1995: {
    id: "komori1995",
    citation:
      "Komori T, et al. Effects of citrus fragrance on immune function and depressive states. Neuroimmunomodulation. 1995;2(3):174-180.",
    doi: "10.1159/000096889",
  },
  shen2005: {
    id: "shen2005",
    citation:
      "Shen J, et al. Olfactory stimulation with scent of grapefruit oil affects autonomic nerves, lipolysis and appetite in rats. Neurosci Lett. 2005;380(3):289-294.",
    doi: "10.1016/j.neulet.2005.01.058",
  },
  srivastava2010: {
    id: "srivastava2010",
    citation:
      "Srivastava JK, Shankar E, Gupta S. Chamomile: a herbal medicine of the past with bright future. Mol Med Rep. 2010;3(6):895-901.",
    doi: "10.3892/mmr.2010.377",
  },
  heuberger2006: {
    id: "heuberger2006",
    citation:
      "Heuberger E, Hongratanaworakit T, Buchbauer G. East Indian sandalwood and alpha-santalol odor increase physiological and self-rated arousal in humans. Planta Med. 2006;72(9):792-800.",
    doi: "10.1055/s-2006-941544",
  },
  moussaieff2008: {
    id: "moussaieff2008",
    citation:
      "Moussaieff A, et al. Incensole acetate, an incense component, elicits psychoactivity by activating TRPV3 channels in the brain. FASEB J. 2008;22(8):3024-3034.",
    doi: "10.1096/fj.07-101865",
  },
  jun2013: {
    id: "jun2013",
    citation:
      "Jun YS, et al. Effect of eucalyptus oil inhalation on pain and inflammatory responses after total knee replacement: a randomized clinical trial. Evid Based Complement Alternat Med. 2013;2013:502727.",
    doi: "10.1155/2013/502727",
  },
  lee2014: {
    id: "lee2014",
    citation:
      "Lee KB, et al. Changes in 5-hydroxytryptamine and cortisol plasma levels in menopausal women after inhalation of clary sage oil. Phytother Res. 2014;28(11):1599-1605.",
    doi: "10.1002/ptr.5163",
  },
  ikei2015: {
    id: "ikei2015",
    citation:
      "Ikei H, Song C, Miyazaki Y. Physiological effect of olfactory stimulation by Hinoki cypress (Chamaecyparis obtusa) leaf oil. J Physiol Anthropol. 2015;34:44.",
    doi: "10.1186/s40101-015-0082-2",
  },
  shirzadegan2017: {
    id: "shirzadegan2017",
    citation:
      "Shirzadegan R, et al. Effects of geranium aroma on anxiety among patients with acute myocardial infarction: a triple-blind randomized clinical trial. Complement Ther Clin Pract. 2017;29:201-206.",
    doi: "10.1016/j.ctcp.2017.10.005",
  },
  tisserand2014: {
    id: "tisserand2014",
    citation: "Tisserand R, Young R. Essential Oil Safety. 2nd ed. Churchill Livingstone; 2014.",
  },
};
