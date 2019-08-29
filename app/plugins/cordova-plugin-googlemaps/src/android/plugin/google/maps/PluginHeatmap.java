package plugin.google.maps;
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.TileOverlayOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.TileOverlay;
import com.google.maps.android.heatmaps.WeightedLatLng;
import com.google.maps.android.heatmaps.HeatmapTileProvider;
//import com.google.maps.android.heatmaps.HeatmapTileProvider.Builder;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.LinkedList;

public class PluginHeatmap extends MyPlugin implements MyPluginInterface {
private String heatmapHashCode;
/**
   * Create heatmap
   * @param args
   * @param callbackContext
   * @throws JSONException
   */
  public void create(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    //args = [{data: [[lat_float, long_float], []...]}, "hashCode"]
    final TileOverlayOptions heatmapOptions = new TileOverlayOptions();
    // int color;
    final JSONObject properties = new JSONObject();
    JSONObject opts = args.getJSONObject(1);
    final String hashCode = args.getString(2);
    heatmapHashCode = hashCode;

    JSONArray data = opts.getJSONArray("data");
    /*if (opts.has("center")) {
      JSONObject center = opts.getJSONObject("center");
      heatmapOptions.center(new LatLng(center.getDouble("lat"), center.getDouble("lng")));
    }
    if (opts.has("radius")) {
      heatmapOptions.radius(opts.getDouble("radius"));
    }
    if (opts.has("strokeColor")) {
      color = PluginUtil.parsePluginColor(opts.getJSONArray("strokeColor"));
      heatmapOptions.strokeColor(color);
    }
    if (opts.has("fillColor")) {
      color = PluginUtil.parsePluginColor(opts.getJSONArray("fillColor"));
      heatmapOptions.fillColor(color);
    }
    if (opts.has("strokeWidth")) {
      heatmapOptions.strokeWidth((int)(opts.getDouble("strokeWidth") * density));
    }
    if (opts.has("visible")) {
      heatmapOptions.visible(opts.getBoolean("visible"));
    }
    if (opts.has("zIndex")) {
      heatmapOptions.zIndex(opts.getInt("zIndex"));
    }
    if (opts.has("clickable")) {
      properties.put("isClickable", opts.getBoolean("clickable"));
    } else {
      properties.put("isClickable", true);
    }*/
    //properties.put("isVisible", heatmapOptions.isVisible());
    // Since this plugin provide own click detection,
    // disable default clickable feature.
    //heatmapOptions.clickable(false);
cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        LinkedList<WeightedLatLng> data_points = new LinkedList<WeightedLatLng>();
        
        try {
          int entries_with_error = 0;
          int entries_with_error_in_weight = 0;
          for (int i = 0; i < data.length(); i++) {
            JSONArray coord = data.getJSONArray(i);

            double lat = 0.;
            double lon = 0.;

            try {
              lat = coord.getDouble(0);
              lon = coord.getDouble(1);
            }
            catch (JSONException je) {
              entries_with_error++;
              continue;
            }

            double weight = 1.;
            if (coord.length() == 3)
              try {
                weight = coord.getDouble(2);
              }
              catch (JSONException je) {
                weight = 1.;
                entries_with_error_in_weight++;
              }

            data_points.add(new WeightedLatLng(new LatLng(lat, lon), weight));
          }

          if (entries_with_error > 0) {
            callbackContext.error("Error while parsing latitude or longitude doubles from " + new Integer(entries_with_error).toString() + " entries.");
          }
          if (entries_with_error_in_weight > 0) {
            callbackContext.error("Error while parsing weight double from " + new Integer(entries_with_error_in_weight).toString() + " entries.");
          }

          HeatmapTileProvider.Builder heatmap_builder = new HeatmapTileProvider.Builder();

          if (opts.has("radius")) {
            int radius = 20;
            try {
              radius = opts.getInt("radius");

              if (radius < 10 || radius > 50) {
                radius = 20;
                callbackContext.error("Radius out of range. Radius must be between 10 and 50.");
              }
              
            } catch (JSONException je) {
              radius = 20;
              je.printStackTrace();
              callbackContext.error(je.getMessage() + "\nError while parsing integer radius.");
            }
            heatmap_builder = heatmap_builder.radius(radius);
          }
          if (opts.has("opacity")) {
            double opacity = 0.7;

            try {
              opacity = opts.getDouble("opacity");

              if (opacity < 0. || opacity > 1.) {
                opacity = 0.7;
                callbackContext.error("Opacity out of range. Raius must be between 0 and 1.");
              }
            } catch (JSONException je) {
              opacity = 0.7;
              je.printStackTrace();
              callbackContext.error(je.getMessage() + "\nError while parsing double opacity.");
            }
            
            heatmap_builder = heatmap_builder.opacity(opacity);
          }

          HeatmapTileProvider heatmap = heatmap_builder.weightedData(data_points).build();
          TileOverlay heatmapTileOverlay = map.addTileOverlay(new TileOverlayOptions().tileProvider(heatmap));
          pluginMap.objects.put("heatmap_" + heatmapHashCode, heatmap);
          pluginMap.objects.put("heatmapTileOverlay_" + heatmapHashCode, heatmapTileOverlay);
          pluginMap.objects.put("heatmap_property_" + heatmapHashCode, properties);

          JSONObject result = new JSONObject();
          
          result.put("hashCode", hashCode);
          result.put("__pgmId", "heatmap_" + hashCode);
          callbackContext.success(result);
        } catch (JSONException e) {
          e.printStackTrace();
          callbackContext.error(e.getMessage() + "");
        }
      }
    });
}
/**
   * set data and refresh heatmap
   * @param args
   * @param callbackContext
   * @throws JSONException
   */
  @SuppressWarnings("unused")
  public void setData(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String id = args.getString(0);
    
    final JSONArray data = args.getJSONArray(1);
    LinkedList<WeightedLatLng> data_points = new LinkedList<WeightedLatLng>();
  for (int i = 0; i < data.length(); i++) {
      JSONArray coord = data.getJSONArray(i);

      double lat = coord.getDouble(0);
      double lon = coord.getDouble(1);

      data_points.add(new WeightedLatLng(new LatLng(lat, lon), 1.));
    }

    final HeatmapTileProvider heatmap = this.getHeatmapTileProvider(id);
cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        // Recalculate the heatmap bounds
        heatmap.setWeightedData(data_points);
        TileOverlay heatmapTileOverlay = (TileOverlay)pluginMap.objects.get("heatmapTileOverlay_" + heatmapHashCode);
        heatmapTileOverlay.clearTileCache();
        //String propertyId = "heatmap_bounds_" + heatmapHashCode;
        //pluginMap.objects.put(propertyId, bounds);
        callbackContext.success();
      }
    });
  }

/**
   * set z-index
   * @param args
   * @param callbackContext
   * @throws JSONException
   */
  @SuppressWarnings("unused")
  public void setZIndex(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    String id = args.getString(0);
    float zIndex = (float) args.getDouble(1);
    this.setFloat("setZIndex", id, zIndex, callbackContext);
  }
/**
   * Set visibility for the object
   * @param args
   * @param callbackContext
   * @throws JSONException
   */
  public void setVisible(JSONArray args, CallbackContext callbackContext) throws JSONException {
    String id = args.getString(0);
    final boolean isVisible = args.getBoolean(1);
    final TileOverlay heatmapTileOverlay = this.getTileOverlay(id);
cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        heatmapTileOverlay.setVisible(isVisible);
      }
    });
    String propertyId = "heatmap_property_" + heatmapHashCode;
    JSONObject properties = (JSONObject)pluginMap.objects.get(propertyId);
    properties.put("isVisible", isVisible);
    pluginMap.objects.put(propertyId, properties);
    callbackContext.success();
  }
  /**
   * Remove the heatmap
   * @param args
   * @param callbackContext
   * @throws JSONException
   */
  public void remove(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    final String id = args.getString(0);
    final TileOverlay heatmapTileOverlay = this.getTileOverlay(id);
    if (heatmapTileOverlay == null) {
      callbackContext.success();
      return;
    }
    cordova.getActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        heatmapTileOverlay.remove();
        if (pluginMap.objects != null) {
          pluginMap.objects.remove(id);
        }
        callbackContext.success();
      }
    });
  }
}
