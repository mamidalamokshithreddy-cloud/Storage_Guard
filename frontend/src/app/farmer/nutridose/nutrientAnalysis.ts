export const processNutrientData = (data: any) => {
  try {
    const items: any[] = [];
    
    // Try to get recommendations from various response shapes
    const allData = data?.nutrient_recommendations || 
                   data?.recommendations || 
                   data?.nutrients || 
                   data?.analysis?.nutrients ||
                   data?.result?.nutrients ||
                   [];

    console.log('Processing nutrient data:', allData);

    // Process each recommendation
    if (Array.isArray(allData)) {
      allData.forEach(rec => {
        items.push({
          name: rec.name || rec.nutrient || rec.type || 'Unknown',
          telugu: rec.telugu || '',
          current: parseFloat(rec.current || rec.value || rec.level || 0),
          required: parseFloat(rec.required || rec.target || rec.optimal || 100),
          deficiency: parseFloat(rec.deficiency || 
            Math.max(0, (rec.required || rec.target || rec.optimal || 100) - 
                      (rec.current || rec.value || rec.level || 0))),
          application: rec.application || rec.recommendation || 'Apply as recommended',
          cost: rec.cost ? `₹${rec.cost}` : 'Contact for pricing',
          timing: rec.timing || 'As needed',
          status: rec.status || 
                 (rec.deficiency > 50 ? 'urgent' : 
                  rec.deficiency > 25 ? 'moderate' : 'low')
        });
      });
    }

    // If no recommendations but we have soil analysis data
    if (items.length === 0 && (data?.soil_analysis || data?.analysis)) {
      const soil = data?.soil_analysis || data?.analysis || {};
      
      // Add NPK data
      const npkData = [
        {
          name: 'Nitrogen (N)',
          telugu: 'నైట్రోజన్',
          current: parseFloat(soil.available_nitrogen || soil.nitrogen || 0),
          required: 200,
          deficiency: Math.max(0, 200 - parseFloat(soil.available_nitrogen || soil.nitrogen || 0)),
          application: 'Apply nitrogen-rich fertilizer',
          timing: 'Based on crop stage',
          cost: '₹1,200 - ₹1,800 per acre',
          status: 'moderate'
        },
        {
          name: 'Phosphorus (P)',
          telugu: 'ఫాస్పరస్',
          current: parseFloat(soil.available_phosphorus || soil.phosphorus || 0),
          required: 40,
          deficiency: Math.max(0, 40 - parseFloat(soil.available_phosphorus || soil.phosphorus || 0)),
          application: 'Apply phosphate fertilizer',
          timing: 'Pre-sowing application',
          cost: '₹800 - ₹1,200 per acre',
          status: 'moderate'
        },
        {
          name: 'Potassium (K)',
          telugu: 'పొటాషియం',
          current: parseFloat(soil.available_potassium || soil.potassium || 0),
          required: 180,
          deficiency: Math.max(0, 180 - parseFloat(soil.available_potassium || soil.potassium || 0)),
          application: 'Apply potassium fertilizer',
          timing: 'Split application',
          cost: '₹900 - ₹1,400 per acre',
          status: 'moderate'
        }
      ];
      
      items.push(...npkData);
    }

    return items;
  } catch (error) {
    console.error('Error processing nutrient data:', error);
    return [];
  }
};

export const retryAnalysis = async (api: string, payload: any) => {
  try {
    const response = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Retry analysis error:', error);
    throw error;
  }
};