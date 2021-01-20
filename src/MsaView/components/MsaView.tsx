import App from "./App";

// can't use public url in plugin
import PF01601_full from "./PF01601_full.js";

const opts = {
  datasets: [
    {
      name: "Spike_rec_bind",
      description: "Spike receptor binding domain",
      branches: [
        ["node3", "SPIKE_CVP67/326-526", 0.0044021],
        ["node3", "Q2QKN3_9BETC/326-526", 0.000545546],
        ["node13", "node3", 0.184142],
        ["node12", "SPIKE_CVHN5/322-526", 0.284527],
        ["node11", "C6GHS2_9BETC/324-530", 0.169522],
        ["node10", "C0KYS1_9BETC/324-540", 0.100405],
        ["node9", "SPIKE_CVMA5/324-534", 1e-9],
        ["node9", "Q9J3E7_9BETC/324-534", 0.00934477],
        ["node10", "node9", 0.176232],
        ["node11", "node10", 0.0888497],
        ["node12", "node11", 0.114123],
        ["node13", "node12", 0.0925582],
        ["node61", "node13", 0.00672813],
        ["node50", "A0A0A7UZR7_9BETC/327-532", 0.286551],
        ["node19", "R9QTH3_CVHSA/321-555", 0.0615283],
        ["node18", "A0A0K1Z074_CVHSA/321-555", 0.000774412],
        ["node18", "A0A166ZL64_9NIDO/316-550", 0.0340301],
        ["node19", "node18", 0.0321586],
        ["node31", "node19", 0.0980282],
        ["node30", "ATO98157.1/317-568", 0.0214425],
        ["node25", "Q1T6X6_CVHSA/317-569", 0.00652008],
        ["node24", "SPIKE_CVHSA/317-569", 0.0019582],
        ["node24", "AAP13441.1/317-568", 0.00217293],
        ["node25", "node24", 0.00174427],
        ["node29", "node25", 0.14259],
        ["node28", "QHD43416.1/330-583", 0.0415892],
        ["node28", "QHR63300.2/330-583", 0.0492027],
        ["node29", "node28", 0.115808],
        ["node30", "node29", 0.0573048],
        ["node31", "node30", 0.0944591],
        ["node39", "node31", 0.698168],
        ["node38", "A0A088DJY6_9BETC/351-629", 0.790301],
        ["node37", "A0A1B3Q5W5_9NIDO/364-584", 0.270725],
        ["node36", "A3EXH4_BCHK9/360-565", 0.301569],
        ["node36", "SPIKE_BCHK9/363-567", 0.367537],
        ["node37", "node36", 0.079718],
        ["node38", "node37", 0.555752],
        ["node39", "node38", 0.177297],
        ["node49", "node39", 0.761404],
        ["node48", "U5LNM4_9BETC/366-630", 0.476639],
        ["node43", "A0A023Y9K3_9BETC/354-613", 0.201065],
        ["node43", "A3EXD9_BCHK5/387-650", 0.180317],
        ["node47", "node43", 0.151873],
        ["node46", "SPIKE_CVEMC/380-534", 0.256477],
        ["node46", "SPIKE_BC133/383-645", 0.29522],
        ["node47", "node46", 0.0192677],
        ["node48", "node47", 0.164582],
        ["node49", "node48", 0.462409],
        ["node50", "node49", 0.306269],
        ["node60", "node50", 0.131154],
        ["node59", "A0A0K2RVL1_9BETC/326-539", 0.192394],
        ["node58", "Q4VID5_CVHOC/339-550", 0.0579613],
        ["node57", "H9AA65_9BETC/326-540", 0.0419032],
        ["node56", "B7U2P4_9BETC/326-540", 0.0123283],
        ["node56", "Q06BD7_9BETC/326-540", 0.0113589],
        ["node57", "node56", 0.0297464],
        ["node58", "node57", 0.0150836],
        ["node59", "node58", 0.135815],
        ["node60", "node59", 0.0263022],
        ["node61", "node60", 0.00672813],
      ],
      rowData: {
        "SPIKE_CVP67/326-526":
          "PDLP-NCDIEAWLNSKTV--SSPLNWERKIFSNCNFNMGRLMSFIQADSFGCNNIDASRLYGMCFGSITIDKFAIPNSRKVDLQVGKSGYLQSFNYKI--DTAVSSCQL-----------------YYSLPA-AN---VS------VTHYNPSSWNRRY--GFNNQS-F-------------GS-RGLHDAVY-SQQC-----------F---N----------TP---N----T------Y----------C------------------------PCRT--SQCIGG-------------------A-----G--TG------T-------------------CPVGTTVRKCF---AAVT--------KAT---K-----------CT------------------CWCQPDPS-------------T----------------------",
        "Q2QKN3_9BETC/326-526":
          "PDLP-NCDIEAWLNSKTV--SSPLNWERKIFSNCNFNMGRLMSFIQADSFGCNNIDASRLYGMCFGSITIDKFAIPNSRKVDLQVGKSGYLQSFNYKI--DTAVSSCQL-----------------YYSLPA-AN---VS------VTHYNPSSWNRRY--GFNNQS-F-------------GS-RGLHDAVY-SQQC-----------F---N----------TP---N----T------Y----------C------------------------PCRT--SQCIGG-------------------A-----G--TG------T-------------------CPVGTTVRKCF---AAVT--------NAT---K-----------CT------------------CWCQPDPS-------------T----------------------",
        "SPIKE_CVHN5/322-526":
          "PNLP-DCDIDNWLNNVSV--PSPLNWERRIFSNCNFNLSTLLRLVHVDSFSCNNLDKSKIFGSCFNSITVDKFAIPNRRRDDLQLGSSGFLQSSNYKI--DISSSSCQL-----------------YYSLPL-VN---VT------INNFNPSSWNRRY--GF---GSF-------------NL--SSYDVVY-SDHC-----------F---S----------VN---S----D------F----------C------------------------PCAD--PSVVNS-------------------C-----A--KS-KPPSAI-------------------CPAGTKYRHCD---------------LDT---TLYVKNW-----CR------------------CSCLPDPI-------------S----------------------",
        "C6GHS2_9BETC/324-530":
          "RNLP-DCKIEEWLAANTV--PSPLNWERKTFQNCNFNLSSLLRFVQAESLSCSNIDASKVYGMCFGSISIDKFAIPNSRRVDLQLGKSGLLQSFNYKI--STRATSCQL-----------------YYSLAQ-NN---VT------VINHNPSSWNRRY--GFNDVATF-------------GS--GIHDVAY-AEAC-----------F---T----------VG---A----S------Y----------C------------------------PCAK--PSIVYS-------------------C-----V--TG-KPKSAN-------------------CPTGTSHRECN---------------VQA---S------GFKHKCD------------------CTCNPSPL-------------T----------------------",
        "C0KYS1_9BETC/324-540":
          "PNLP-DCKIEEWLTAKSV--PSPLNWERRTFQNCNFNLSSLLRYVQAESLSCNNIDASKVYGMCFGSVSVDKFAIPRSRQIDLQIGNSGFLQTANYKI--DTAATSCQL-----------------YYSLPK-NN---VT------INNYNPSSWNRRY--GFNDAGVF-------------GK--SKHDVAY-AQQC-----------F---T----------VR---P----S------Y----------C------------------------PCAQ--PDIVSA-------------------C-----T--SQTKPMSAY-------------------CPTGTIHRECSLWN----GPHLRSARVGSGTYT-----------CE------------------CTCKPNPF-------------D----------------------",
        "SPIKE_CVMA5/324-534":
          "ANLP-ACNIEEWLTARSV--PSPLNWERKTFQNCNFNLSSLLRYVQAESLFCNNIDASKVYGRCFGSISVDKFAVPRSRQVDLQLGNSGFLQTANYKI--DTAATSCQL-----------------HYTLPK-NN---VT------INNHNPSSWNRRY--GFNDAGVF-------------GK--NQHDVVY-AQQC-----------F---T----------VR---S----S------Y----------C------------------------PCAQ--PDIVSP-------------------C-----T--TQTKPKSAF----------------------------VN---------------VGD---H-----------CEGLGVLEDNCGNADPHKG-CICANNSF-------------I----------------------",
        "Q9J3E7_9BETC/324-534":
          "ANLP-ACNIEEWLTARSV--PSPLNWERKTFQNCNFNLSSLLRYVQAESLFCNNMDASKVYGRCFGSISVDKFAVPRSRQVDLQLGNSGFLQTANYKI--DTAATSCQL-----------------HYTLPK-NN---VT------INNHNPSSWNRRY--GFNDAGVF-------------GK--NQHDVVY-AQQC-----------F---T----------VR---S----S------Y----------C------------------------PCAQ--PDIVSP-------------------C-----T--TQTKPKSAF----------------------------VN---------------VGD---H-----------CEGLGVLEDNCGNADPHKG-CICANNSF-------------I----------------------",
        "A0A0A7UZR7_9BETC/327-532":
          "PNLP-DCEIEQWLNDPQV--PSPISWERKTFSNCNFNMSSLLSKVRATSFSCNNIDASKIYDMCFGSITIDKFAIPNSRKVDLQFGSSGYIQNYNYRL--DQSATSCQL-----------------YYGIPA-NN---VT------VTKKNPSGWNNRY--GFVE---FKPL--------NIGQNYNKYSAIY-STMC-----------F---N----------VP---N----D------Y----------C------------------------PCK------LGCP-----TG-----TVERPQI-----G--TS------TSGQPI---------YDCPGYPWLTS--------------------------------------SA------------------CKQTPATV------------------------------------",
        "R9QTH3_CVHSA/321-555":
          "PNITNRCPFDRVFNASRF--PSVYAWERTKISDCVADYTVLYNSTSFSTFKCYGVSPSKLIDLCFTSVYADTFLIRFSEVRQIAPGETGVIADYNYKLPDEFTGCVIAW-----------------NTANQD-RG---Q-----------YYYRSSRKT--KLKP---FERD-LSSD------------------ENG-----------V---R----------TL---S----T------YDFYP------SVPL----E-YQATRV------VVLSFE------LLNA-----PA-----TV----C-----G--PK------LSTSLIKNQCVNFNFNGLKGTGVLTD--------------------------------------SS------------------KKFQSFQQFGRDASDFTDSVRDPQTLQ-----------------",
        "A0A0K1Z074_CVHSA/321-555":
          "PNITNLCPFDKVFNATRF--PSVYAWERTKISDCVADYTVFYNSTSFSTFNCYGVSPSKLIDLCFTSVYADTFLIRFSEVRQVAPGQTGVIADYNYKLPDDFTGCVIAW-----------------NTAKYD-VG---S-----------YFYRSHRSS--KLKP---FERD-LSSE------------------ENG-----------A---R----------TL---S----T------YDFNQ------NVPL----E-YQATRV------VVLSFE------LLNA-----PA-----TV----C-----G--PK------LSTSLVKNQCVNFNFNGFKGTGVLTD--------------------------------------SS------------------KTFQSFQQFGRDASDFTDSVRDPKTLQ-----------------",
        "A0A166ZL64_9NIDO/316-550":
          "PNITNVCPFDKVFNATRF--PSVYAWERTKISDCVADYTVFYNSTSFSTFNCYGVSPSKLIDLCFTSVYADTFLIRFSEVRQVAPGQTGVIADYNYKLPDDFIGCVIAW-----------------NTAKQD-VG---S-----------YFYRSHRSS--KLKP---FERD-LSSE------------------ENG-----------V---L----------TL---S----T------YDFNQ------NVPL----E-YQATRV------VVLSFE------LLNA-----PA-----TV----C-----G--PK------LSTPLVKNQCVNFNFNGLKGTGVLTD--------------------------------------SS------------------KTFQSFQQFGRDASDFTDSVRDPQTLQ-----------------",
        "ATO98157.1/317-568":
          "PNITNLCPFGEVFNATTF--PSVYAWERKRISNCVADYSVLYNSTSFSTFKCYGVSATKLNDLCFSNVYADSFVVKGDDVRQIAPGQTGVIADYNYKLPDDFLGCVLAW-----------------NTNSKD-SS---TS------GNYNYLYRWVRRS--KLNP---YERD-LSNDIYSPGGQ---SCSAI--GPNC-----------Y---N----------PL---R----P------YGFFT------TAGV----G-HQPYRV------VVLSFE------LLNA-----PA-----TV----C-----G--PK------LSTDLIKNQCVNFNFNGLTGTGVLTS--------------------------------------SS------------------KRFQPFQQFGRDVSDFTDSVRDPKTS------------------",
        "Q1T6X6_CVHSA/317-569":
          "PNITNLCPFGEVFNATKF--PSVYAWERKKISNCVADYSVLYNSTFFSTFKCYGVSATKLNDLCFSNVYADSFVVKGDDVRQIAPGQTGVIADYNYKLPDDFMGCVLAW-----------------NTRNID-AT---ST------GNYNYKYRCLRHG--KLRP---FERD-ISNVPFSPDGK---PCTPP--AFNC-----------Y---W----------PL---N----D------YGFYT------TTGI----G-YQPYRV------VVLSFE------LLNA-----PA-----TV----C-----G--PK------LSTDLIKNQCVNFNFNGLTGTGVLTP--------------------------------------SS------------------KRFQPFQQFGRDVSDFTDSVRDPKTSE-----------------",
        "SPIKE_CVHSA/317-569":
          "PNITNLCPFGEVFNATKF--PSVYAWERKKISNCVADYSVLYNSTFFSTFKCYGVSATKLNDLCFSNVYADSFVVKGDDVRQIAPGQTGVIADYNYKLPDDFMGCVLAW-----------------NTRNID-AT---ST------GNYNYKYRYLRHG--KLRP---FERD-ISNVPFSPDGK---PCTPP--ALNC-----------Y---W----------PL---N----D------YGFYT------TTGI----G-YQPYRV------VVLSFE------LLNA-----PA-----TV----C-----G--PK------LSTDLIKNQCVNFNFNGLTGTGVLTP--------------------------------------SS------------------KRFQPFQQFGRDVSDFTDSVRDPKTSE-----------------",
        "AAP13441.1/317-568":
          "PNITNLCPFGEVFNATKF--PSVYAWERKKISNCVADYSVLYNSTFFSTFKCYGVSATKLNDLCFSNVYADSFVVKGDDVRQIAPGQTGVIADYNYKLPDDFMGCVLAW-----------------NTRNID-AT---ST------GNYNYKYRYLRHG--KLRP---FERD-ISNVPFSPDGK---PCTPP--ALNC-----------Y---W----------PL---N----D------YGFYT------TTGI----G-YQPYRV------VVLSFE------LLNA-----PA-----TV----C-----G--PK------LSTDLIKNQCVNFNFNGLTGTGVLTP--------------------------------------SS------------------KRFQPFQQFGRDVSDFTDSVRDPKTS------------------",
        "QHD43416.1/330-583":
          "PNITNLCPFGEVFNATRF--ASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAW-----------------NSNNLD-SK---VG------GNYNYLYRLFRKS--NLKP---FERD-ISTEIYQAGST---PCNGV-EGFNC-----------Y---F----------PL---Q----S------YGFQP------TNGV----G-YQPYRV------VVLSFE------LLHA-----PA-----TV----C-----G--PK------KSTNLVKNKCVNFNFNGLTGTGVLTE--------------------------------------SN------------------KKFLPFQQFGRDIADTTDAVRDPQTLE-----------------",
        "QHR63300.2/330-583":
          "PNITNLCPFGEVFNATTF--ASVYAWNRKRISNCVADYSVLYNSTSFSTFKCYGVSPTKLNDLCFTNVYADSFVITGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAW-----------------NSKHID-AK---EG------GNFNYLYRLFRKA--NLKP---FERD-ISTEIYQAGSK---PCNGQ-TGLNC-----------Y---Y----------PL---Y----R------YGFYP------TDGV----G-HQPYRV------VVLSFE------LLNA-----PA-----TV----C-----G--PK------KSTNLVKNKCVNFNFNGLTGTGVLTE--------------------------------------SN------------------KKFLPFQQFGRDIADTTDAVRDPQTLE-----------------",
        "A0A088DJY6_9BETC/351-629":
          "ADVSAECPFQSLINVTEATIPSPAFWRRHYVRNCNYDISVFTDNADVYSLQCYGVAPSSLADMCWEEAHIDYMKISEKDIFSFKPSGAGDFAKYNYKLPSDFMGCTVVFTNQELTCNATSGQLCHVYTNNLT-NYPAEAT------AWDKSHYESIERY--QMWS---SENV-YNCELQEVGPQ---QFNRM--PRNC-----------YVRSN----------NS---N----D------Y----------WQPM----S-FRG--VNSLMVAMAITLK------PTRT-----SA-----TV----C-----GY-KQ------KTTPLVLNECITYHIYGYKGTGVIVS--------------------------------------AN------------------YTFQSFQTVQLTSTGSLHSFKYNNTIY-----------------",
        "A0A1B3Q5W5_9NIDO/364-584":
          "---SCAIPYTTIL---EP--PSPAAWVRATISNCTFDFESLLRTLPTYNLKCYGISPARLSTMCYAGVTLDIFKLNTTHLSNMLGSVPDAVSIYNYALPSNFYGCVHAY-----------------HLNSTT-PY---AV------AVPPGAY-----------------------PIKPGGRQ---LFNSF--VSQV-----------L---D----------SP---T----S------Q----------CTPA----N-CMG--V------VVIGLT------PASG-----SN-----LV----C-----P--KA------NDTQVIEGQCVKYNFYGYAGTGVINQ--------------------------------------SD------------------LAIPNNKLFVTSKSGAVLAVRAGD--------------------",
        "A3EXH4_BCHK9/360-565":
          "----------DIV---RP--PQPVVWRRYTVTSCSFDFEAIVNRLPTFELKCFGISPARLAQMCYSSVTLDLFRANTTHLANMLGGVPDLFSKYNYALPSNFYGCVHAY-----------------YINDTNKDY---AI------AQRWPAT-----------------------PITPGGRQ---PYSDY--VRTV-----------L---N----------TP---N----P------S----------CTTL----T-CFG--V------VVISLK------PASG-----RK-----LV----C-----P--SV------NDTDMRTNECVKYNLYGYTGTGVFNV--------------------------------------ST------------------LTIPDSKLFVANGAG-----------------------------",
        "SPIKE_BCHK9/363-567":
          "----------VLQ---DP--PQPVVWRRYMLYDCVFDFTVVVDSLPTHQLQCYGVSPRRLASMCYGSVTLDVMRINETHLNNLFNRVPDTFSLYNYALPDNFYGCLHAF-----------------YLNSTA-PY---AV------ANR---F-----------------------PIKPGGRQ---SNSAF--IDTV-----------I---N----------A---------A------H----------YSPF----SYVYG--L------AVITLK------PAAG-----SK-----LV----C-----P--VA------NDTVVITDRCVQYNLYGYTGTGVLSK--------------------------------------NT-----------------SLVIPDGKVFTASSTGTII--------------------------",
        "U5LNM4_9BETC/366-630":
          "AELT-ECDLDVLFKN-DA--PIIANYSRRVFTNCNYNLTKLLSLVQVDEFVCHKTTPEALATGCYSSLTVDWFALPFSMKSTLAIGSAEAISMFNYNQ--DYSNPTCRI-----------------HAAVTA-NV---ST---ALNFTANANYAYISRC--QGVD---GK------PILLQPGQ-MT---NI--ACRSGVLARPSDADYF---G----------YSFQGR----N------Y----YLGRKSYKPKTDEGD-VQM--V------YVITPK------YDKG-----PD-----TV----CPLKDMG-AAS------SSLDGLLGQCIDYDIHGVVGRGVFQV--------------------------------------CN------------------TTGIASQIFVYDGFGNIIGFHS----------------------",
        "A0A023Y9K3_9BETC/354-613":
          "QG-T-ECDFSPLLKD-EP--PQVYNFSRLVFTNCNYNLTKLLALFQVSQFSCHQVSPSALASGCYSSLTVDYFAYPTYMSSYLQQGSTGEISQFNYKQ--DFSNPTCRI-----------------LATVPA-NL---SASGL---LPKPSNYVWLSECYQNSFT---GKNF-----QYVKAGQ-YTPCLGL--AANG-----------F---E----------KSYQTHRDPVS------K----LAVTGVVTPMT--SA-LQM--A------FIISVQ------YGTD-----SN-----SV----CPMQAVR--ND------TSVDDKLGLCIDYSLYGITGRGVFQN--------------------------------------CT------------------AVGIRQQRFVYDSFDNLVGYHA----------------------",
        "A3EXD9_BCHK5/387-650":
          "ATTQ-ECDFTPMLTG-TP--PPIYDFKRLVFTNCNYNLTKLLSLFQVSEFSCHQVSPSSLATGCYSSLTVDYFAYSTDMSSYLQPGSAGEIVQFNYKQ--DFSNPTCRV-----------------LATVPT-NL---TT------ITKSSNYVHLTECYKSTAY---GKNY-----LYNAPGG-YTPCLSL--ASRG-----------F---T----------TNRQSH----SLELPDGY----LVTTGSVYPVN--GN-LQM--A------FIISVQ------YGTD-----TN-----SV----CPMQALR--ND------TSIEDKLDVCVEYSLHGITGRGVFHN--------------------------------------CT------------------SVGLRNQRFVYDTFDNLVGYHS-----DNGN-------------",
        "SPIKE_CVEMC/380-534":
          "G--V-ECDFSPLLSG-TP--PQVYNFKRLVFTNCNYNLTKLLSLFSVNDFTCSQISPAAIASNCYSSLILDYFSYPLSMKSDLSVSSAGPISQFNYKQ--SFSNPTCLI-----------------LATVPH-NL---TT------ITKPLKYSYINKC--SRFL---SDDR-TEVPQLVNANQ-YSPCVSI--VP--------------------------------------------------------------------------------------------------------------------------S------TV------------------------------------------------------------------------------------------------------------------------------",
        "SPIKE_BC133/383-645":
          "PNVT-ECDFSPMLTG-VA--PQVYNFKRLVFSNCNYNLTKLLSLFAVDEFSCNGISPDAIARGCYSTLTVDYFAYPLSMKSYIRPGSAGNIPLYNYKQ--SFANPTCRV-----------------MASVPD-NV----T------ITKPGAYGYISKC--SRLT---GVNQDIETPLYINPGE-YSICRDF--APLG-----------F---SEDGQVFKRTLTQFEGG----G------L----LIGVGTRVPMT--AN-LEM--G------FVISVQ------YGTG-----TD-----SV----CPMLDLG--DS------LTITNRLGKCVDYSLYGVTGRGVFQN--------------------------------------CT------------------AVGVKQQRFVYDSFDNLVG-------------------------",
        "A0A0K2RVL1_9BETC/326-539":
          "PNLP-DCNMEDWLSAPTV--ASPLNWERRTFSNCNFNMSSLLSLIQADSFSCSNIDAAKLYGMCFGSVTIDKFAIPNNRKVDLQLGNLGYLQSFNYRI--DTTATSCQL-----------------FYSLGA-DN---VT------VTRSNPSAWNRRY--GFND-TMFKPQ--------PAGF-FTNHDVVY-SKQC-----------F---K----------VP---N----T------Y----------C------------------------PCKNNGATCVGNGVSAGVSG-----TT----T-----G--SG------T-------------------CPVGTSYRTCF---------------NPI---Q-----------CA------------------CTCDPEPI-------------N----------------------",
        "Q4VID5_CVHOC/339-550":
          "PDLP-NCNIEAWLNDKSV--PSPLNWERKTFSNCNFNMSSLMSFIQADSFTCNNIDAAKIYGMCFSSITIDKFAIPNRRKVDLQLGNLGYLQSSNYRI--DTTATSCQL-----------------YYNLPA-AN---VS------VSRFNPSTWNKRF--GFIEDSVFVPQ--------PTGV-FTNHSVVY-AQHC-----------F---K----------AP---K----N------F----------C------------------------PCKLNGSC----------PG-----KN----N-----G--IG------T-------------------CPAGTNYLTCD---------------N--------------------------------------LCTLDPI-------------T---------FKAPGTYKCPQTK",
        "H9AA65_9BETC/326-540":
          "PNLP-DCNIEAWLNDKSV--PSPLNWERKTFSNCNFNMSSLMSFIQADSFTCNNIDAAKIYGMCFSSITIDKFAIPNGRKVDLQLGNLGYLQSFNYKI--DTSATSCQL-----------------YYNLPA-AN---VS------VSRLNPSTWNRRF--GFTEQSVFKPQ--------PAGF-FTAHDVVY-AQHC-----------F---K----------AP---T----T------F----------C------------------------PCKLNGSLCVGSG-----SGVDAGFKH----T-----G--IG------T-------------------CPAGTNYLTCY---------------NSV---Q-----------CN------------------CQCTPDPI-------------L----------------------",
        "B7U2P4_9BETC/326-540":
          "PNLP-DCNIEAWLNDKSV--PSPLNWERKTFSNCNFNMSSLMSFIQADSFTCNNIDAAKIYGMCFSSITIDKFAIPNGRKVDLQLGNLGYLQSFNYRI--DTTATSCQL-----------------YYNLPA-AN---VS------VSRFNPSTWNRRF--GFTEQSVFKPQ--------PAGV-FTDHDVVY-AQHC-----------F---K----------AP---T----N------F----------C------------------------PCKLDGSLCVGSG-----SGIDAGYKN----T-----G--IG------T-------------------CPAGTNYLTCH---------------NAA---Q-----------CD------------------CLCTPDPI-------------T----------------------",
        "Q06BD7_9BETC/326-540":
          "PNLP-DCNIEAWLNDKSV--PSPLNWERKTFSNCNFNMSSLMSFIQADSFTCNNIDAAKIYGMCFSSITIDKFAIPNGRKVDLQLGNLGYLQSFNYRI--DTTATSCQL-----------------YYNLPA-AN---VS------VSRFNPSTWNRRF--GFTEQSVFKPQ--------PAGV-FTDHDVVY-AQHC-----------F---K----------AP---T----N------F----------C------------------------PCKLDGSLCVGNG-----PGIDAGYKT----S-----G--IG------T-------------------CPAGTNYLTCH---------------NAA---Q-----------CN------------------CLCTPDPI-------------T----------------------",
      },
      structure: {
        "SPIKE_CVHSA/317-569": [
          {
            pdb: "5wrg",
            chains: [
              {
                startPos: 317,
                chain: "A",
              },
              {
                startPos: 317,
                chain: "B",
              },
              {
                startPos: 317,
                chain: "C",
              },
            ],
          },
          {
            pdb: "5xlr",
            chains: [
              {
                startPos: 317,
                chain: "A",
              },
            ],
          },
        ],
      },
    },
    {
      name: "Corona_S2",
      auto: PF01601_full,
    },
  ],
  //  dataurl: '%PUBLIC_URL%/PF01601_full.txt',
  config: {
    containerHeight: "1000px",
    handler: {
      click: (coords: any) => {
        console.warn(
          `Click ${coords.node} column ${coords.column}${
            coords.isGap ? "" : `, position ${coords.seqPos}`
          } (${coords.c})`,
        );
      },
    },
  },
};

export default (pluginManager: any) => {
  const { jbrequire } = pluginManager;
  const { observer } = jbrequire("mobx-react");
  const React = jbrequire("react");
  const AppComponent = jbrequire(App);

  return observer(({ model }: { model: any }) => {
    const { initialized } = model;

    if (!initialized) {
      return null;
    }

    return <AppComponent {...opts} model={model} />;
  });
};
